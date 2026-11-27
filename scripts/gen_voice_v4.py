#!/usr/bin/env python3
"""Generate Tagalog narration with ElevenLabs eleven_v4 (/with-timestamps) from SCRIPT.md.
Uses steady informative documentary pacing and gently tightens dead silences > max_gap
down to keep_gap with cosine crossfades while preserving natural comedic breath pauses.
Writes voice/voice.wav (48 kHz mono 16-bit PCM) and voice/words.json.
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import wave
import numpy as np

SR = 48000
API = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"


def extract_narration(script_path: str) -> list[str]:
    lines = []
    in_body = False
    with open(script_path, encoding="utf-8") as f:
        for raw in f:
            s = raw.strip()
            if not s:
                if lines:
                    continue
                in_body = True
                continue
            if not in_body:
                continue
            if s.startswith("#") or s.startswith("("):
                continue
            lines.append(s)
    return lines


def call_elevenlabs(text: str, voice_id: str, api_key: str, model_id: str, output_format: str, speed: float):
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "speed": speed,
        },
    }
    body = json.dumps(payload).encode("utf-8")
    url = API.format(voice_id=voice_id) + f"?output_format={output_format}"
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:800]
        raise RuntimeError(f"HTTP {e.code}: {detail}")


def decode_to_pcm48k(audio_bytes: bytes, output_format: str) -> np.ndarray:
    if output_format.startswith("pcm_"):
        rate = int(output_format.split("_")[1])
        suffix = ".pcm"
        in_args = ["-f", "s16le", "-ar", str(rate), "-ac", "1"]
    else:
        suffix = ".mp3"
        in_args = []
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tf:
        tf.write(audio_bytes)
        src = tf.name
    try:
        cmd = ["ffmpeg", "-v", "error", *in_args, "-i", src,
               "-ac", "1", "-ar", str(SR), "-f", "s16le", "-acodec", "pcm_s16le", "-"]
        raw = subprocess.run(cmd, capture_output=True, check=True).stdout
        return np.frombuffer(raw, dtype=np.int16).astype(np.float64)
    finally:
        os.unlink(src)


def group_words(al: dict) -> list[dict]:
    chars = al["characters"]
    cs = al["character_start_times_seconds"]
    ce = al["character_end_times_seconds"]
    out = []
    cur, s, e = "", None, None
    for ch, a, b in zip(chars, cs, ce):
        if ch.isspace():
            if cur:
                out.append({"w": cur, "s": float(s), "e": float(e)})
                cur, s, e = "", None, None
            continue
        if not cur:
            s = a
        cur += ch
        e = b
    if cur:
        out.append({"w": cur, "s": float(s), "e": float(e)})
    return out


def tighten_pauses(samples: np.ndarray, words: list[dict], lead: float, tail: float, max_gap: float, keep_gap: float):
    """Trim leading/trailing silence and gently cap long inter-sentence dead silences using RMS envelope."""
    n = len(samples)
    hop = int(0.01 * SR)
    pad_n = (hop - (n % hop)) % hop
    rms = np.sqrt(np.mean(np.pad(samples, (0, pad_n)).reshape(-1, hop) ** 2, axis=1))
    thresh = np.percentile(rms, 90) * 0.035

    first_t = max(0.0, words[0]["s"] - lead)
    last_t = min(n / SR, words[-1]["e"] + tail)

    quiet = rms < thresh
    cuts = []
    cur_a = None
    for k, q in enumerate(quiet):
        if q and cur_a is None:
            cur_a = k
        elif not q and cur_a is not None:
            q_start = cur_a * 0.01
            q_end = k * 0.01
            sil_dur = q_end - q_start
            if q_start > first_t + 0.05 and q_end < last_t - 0.05:
                nxt = next((w["w"] for w in words if w["s"] >= q_start - 0.04), "")
                target_gap = keep_gap
                # Preserve dramatic story breath before key Tagalog story beats
                if nxt in ("Walang", "Tumingin", '"Okay', "Okay", "Pero", "Lumipas", "Kinabukasan,", "Nandoon", "Biglang", "Sino", "Abangan"):
                    target_gap = max(keep_gap, 0.24)
                if sil_dur > max_gap and sil_dur > target_gap + 0.04:
                    rm = sil_dur - target_gap
                    mid = 0.5 * (q_start + q_end)
                    cuts.append((mid - rm * 0.5, mid + rm * 0.5))
            cur_a = None

    xf = int(0.012 * SR)
    segs = []
    cur = first_t
    for ca, cb in cuts:
        if ca > cur + 0.03:
            segs.append((cur, ca))
            cur = cb
    if last_t > cur:
        segs.append((cur, last_t))

    out = None
    for sa, sb in segs:
        i0 = max(0, int(round(sa * SR)))
        i1 = min(n, int(round(sb * SR)))
        chunk = samples[i0:i1].copy()
        if out is None:
            out = chunk
        else:
            k = min(xf, len(out), len(chunk))
            if k > 1:
                w = 0.5 * (1 - np.cos(np.linspace(0, np.pi, k)))
                out[-k:] = out[-k:] * (1 - w) + chunk[:k] * w
                out = np.concatenate([out, chunk[k:]])
            else:
                out = np.concatenate([out, chunk])

    def remap(t: float) -> float:
        removed = first_t
        for ca, cb in cuts:
            if t >= cb:
                removed += (cb - ca) + (xf / SR)
            elif t > ca:
                removed += (t - ca)
        return max(0.0, t - removed)

    new_words = [{"w": w["w"], "s": round(remap(w["s"]), 3), "e": round(remap(w["e"]), 3)} for w in words]

    fi = min(int(0.015 * SR), len(out))
    fo = min(int(0.04 * SR), len(out))
    out[:fi] *= np.linspace(0.0, 1.0, fi)
    out[-fo:] *= np.linspace(1.0, 0.0, fo)
    return out, new_words, len(cuts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", default="SCRIPT.md")
    ap.add_argument("--out-dir", default="voice")
    ap.add_argument("--model", default="eleven_v4")
    ap.add_argument("--speed", type=float, default=1.18)
    ap.add_argument("--lead", type=float, default=0.07)
    ap.add_argument("--tail", type=float, default=0.40)
    ap.add_argument("--max-gap", type=float, default=0.24)
    ap.add_argument("--keep-gap", type=float, default=0.14)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID")
    if not api_key or not voice_id:
        sys.exit("Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in environment.")

    os.makedirs(args.out_dir, exist_ok=True)
    wav_path = os.path.join(args.out_dir, "voice.wav")
    words_path = os.path.join(args.out_dir, "words.json")
    raw_json_path = os.path.join(args.out_dir, "raw_alignment.json")

    if os.path.exists(wav_path) and not args.force:
        print(f"[tts] {wav_path} already exists; use --force to regenerate.")
        return

    lines = extract_narration(args.script)
    full_text = " ".join(lines)
    n_words = len(full_text.split())
    print(f"[tts] Generating single-take Tagalog narration with {args.model} (speed={args.speed}): {len(lines)} lines, {n_words} words")

    res = None
    chosen_fmt = None
    for fmt in ("pcm_48000", "mp3_44100_192", "mp3_44100_128"):
        try:
            print(f"[tts] Trying output_format={fmt} ...")
            res = call_elevenlabs(full_text, voice_id, api_key, args.model, fmt, args.speed)
            chosen_fmt = fmt
            break
        except RuntimeError as e:
            print(f"[tts] Format {fmt} failed: {e}")
    if res is None:
        sys.exit("[tts] All output formats failed.")

    audio_bytes = base64.b64decode(res["audio_base64"])
    al = res.get("alignment") or res.get("normalized_alignment")
    if not al or not al.get("characters"):
        sys.exit("[tts] Response contained no alignment timestamps.")

    with open(raw_json_path, "w", encoding="utf-8") as f:
        json.dump({"model": args.model, "format": chosen_fmt, "speed": args.speed,
                   "alignment": al, "normalized_alignment": res.get("normalized_alignment")}, f, indent=1)

    samples = decode_to_pcm48k(audio_bytes, chosen_fmt)
    raw_words = group_words(al)
    print(f"[tts] Raw audio: {len(samples)/SR:.3f} s ({len(raw_words)} words, {len(raw_words)/(len(samples)/SR):.2f} w/s)")

    out, words, n_cuts = tighten_pauses(samples, raw_words, args.lead, args.tail, args.max_gap, args.keep_gap)
    out_i16 = np.clip(np.round(out), -32768, 32767).astype(np.int16)

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(out_i16.tobytes())

    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(words, f, indent=1, ensure_ascii=False)

    dur = len(out_i16) / SR
    wps = len(words) / max(dur, 0.01)
    print(f"[tts] SUCCESS ({chosen_fmt}, trimmed {n_cuts} long silences): {wav_path} = {dur:.3f} s ({int(round(dur*30))} frames @ 30 fps), {len(words)} words ({wps:.2f} w/s)")


if __name__ == "__main__":
    main()

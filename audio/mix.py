#!/usr/bin/env python3
"""Final BS.1770-4 master mix for 'Sa Kabilang Oras (Part 1)'.
Follows cartoon-3d-short standard mix rules:
  - Voice unchanged (lossless ElevenLabs eleven_v4 pcm_48000 Tagalog narration, gain only)
  - Music +3 dB standard (-10.0 to -11.2 LU relative to voice after -3 dB speech ducking)
  - SFX -6 dB relative to hot SFX bed (supportive, crisp, un-ducked on major story impact cues)
  - Master normalized to -15.0 LUFS integrated, 4x-oversampled look-ahead true-peak limiter <= -1.2 dBTP
  - Outputs: audio/mix.wav (48 kHz stereo 24-bit, exact duration), stems, and audio/cues.md
"""
import json
import os
import subprocess
import sys
import time
import numpy as np
from scipy import ndimage, signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from dsp import SR, ns, st, dbg, read_wav, write_wav, integrated, lra, true_peak
import music as M
import sfx as S

TARGET_LUFS = -15.0
CEIL_DBTP = -1.2
DUCK_DB = -3.0

MUSIC_TARGET = {
    "crash":       -10.2,
    "awakening":   -10.6,
    "old_era":     -10.6,
    "clara":       -10.4,
    "clock":       -10.8,
    "montage":     -10.2,
    "in_love":     -10.2,
    "crack":       -10.4,
    "library":     -10.6,
    "cliffhanger": -9.8,
}


def log(*a):
    print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)


def speech_spans(words, merge=0.28):
    sp = []
    for w in words:
        s, e = float(w["s"]), float(w["e"])
        if sp and s - sp[-1][1] < merge:
            sp[-1][1] = max(sp[-1][1], e)
        else:
            sp.append([s, e])
    return sp


def duck_db(spans, dur, N, depth=DUCK_DB, pre=0.07, post=0.11, att=0.06, rel=0.40):
    ctrl = 1000
    nc = int(dur * ctrl) + 2
    va = np.zeros(nc)
    for s, e in spans:
        va[max(0, int((s - pre) * ctrl)): int((e + post) * ctrl)] = 1.0
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc)
    e = 0.0
    for i in range(nc):
        tgt = va[i]
        e += (tgt - e) * (ka if tgt > e else kr)
        env[i] = e
    return np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth * env)


def limiter(x, ceil_db=CEIL_DBTP, look=0.003, rel=0.08):
    c = dbg(ceil_db)
    n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest")
    g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        kr = 1 - np.exp(-1 / (rel * SR))
        gap = ns(rel * 8)
        brk = np.flatnonzero(np.diff(idx) > gap)
        starts = np.concatenate([[idx[0]], idx[brk + 1]])
        ends = np.concatenate([idx[brk], [idx[-1]]])
        for a, b_ in zip(starts, ends):
            e = min(n, b_ + gap)
            seg = g1[a:e]
            out = np.empty(len(seg))
            g = 1.0
            for k in range(len(seg)):
                g = min(seg[k], g + (1 - g) * kr)
                out[k] = g
            g2[a:e] = out
    g3 = np.minimum(ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest"), 1.0)
    return x * g3[None, :], g3


def main():
    tl = json.load(open(os.path.join(ROOT, "out", "kabilang", "timeline.json"), encoding="utf-8"))
    words = json.load(open(os.path.join(ROOT, "voice", "words.json"), encoding="utf-8"))
    dur = float(tl["duration_s"])
    N = ns(dur)

    # 1. Load pure ElevenLabs v4 Tagalog voice unchanged
    vx, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR, f"Expected {SR} Hz voice, got {sr}"
    v_mono = vx[0] if vx.shape[0] == 1 else vx.mean(0)
    v_pad = np.zeros(N)
    v_pad[: min(N, len(v_mono))] = v_mono[:N]
    v = st(v_pad)
    Lv_all = integrated(v)
    log(f"Voice loaded: {dur:.3f} s ({N} samples), integrated = {Lv_all:.2f} LUFS")

    # 2. Synthesize score & duck under speech (+3 dB music standard)
    log("Synthesizing music stem ...")
    m_raw = M.render_music(tl)
    spans = speech_spans(words)
    duck = duck_db(spans, dur, N)
    m_duck = m_raw * dbg(duck)[None, :]

    secs = M.build_sections(tl)
    t_arr = np.arange(N) / SR
    sec_gain = np.zeros(N)
    gains_map = {}
    for name, a, b in secs:
        seg = slice(ns(a), ns(b))
        Lm = integrated(m_duck[:, seg])
        Lv = integrated(v[:, seg])
        if not np.isfinite(Lv):
            Lv = Lv_all
        g = (Lv + MUSIC_TARGET[name] - Lm) if np.isfinite(Lm) else 0.0
        gains_map[name] = g
        sec_gain[(t_arr >= a) & (t_arr < b)] = g
    sec_gain = ndimage.uniform_filter1d(sec_gain, ns(0.35), mode="nearest")
    m = m_duck * dbg(sec_gain)[None, :]

    # 3. Synthesize SFX stem (-6 dB clean under speech, punchy on major story impacts)
    log("Synthesizing SFX stem ...")
    s_raw, cues = S.render_sfx(tl)
    Ls = integrated(s_raw)
    sfx_gain = (Lv_all - 11.5) - Ls if np.isfinite(Ls) else 0.0
    s_duck = duck_db(spans, dur, N, depth=-3.5, pre=0.05, post=0.08, att=0.04, rel=0.25)
    ev = tl["events"]
    fps = tl["fps"]
    for f_impact in (ev["F_CAR_IMPACT"], ev["F_HAND_GLOW"], ev["F_PHOTO_BACK"], ev["F_ROAD_QUAKE"], ev["F_LIGHT_OPEN"]):
        ia = max(0, ns(f_impact / fps - 0.15))
        ib = min(N, ns(f_impact / fps + 0.70))
        s_duck[ia:ib] = 0.0
    s = s_raw * dbg(sfx_gain + s_duck)[None, :]

    # 4. Sum + master to -15.0 LUFS + 4x oversampled true-peak limit <= -1.2 dBTP
    raw_sum = v + m + s
    L_sum = integrated(raw_sum)
    master_db = TARGET_LUFS - L_sum
    g_m = dbg(master_db)
    v_m, m_m, s_m = v * g_m, m * g_m, s * g_m
    mix, gr = limiter(v_m + m_m + s_m, ceil_db=CEIL_DBTP)
    L_fin = integrated(mix)
    if abs(L_fin - TARGET_LUFS) > 0.15:
        mix, gr2 = limiter(mix * dbg(TARGET_LUFS - L_fin), ceil_db=CEIL_DBTP)
        gr = gr * gr2

    write_wav(os.path.join(HERE, "stem_voice.wav"), v_m, 24)
    write_wav(os.path.join(HERE, "stem_music.wav"), m_m, 24)
    write_wav(os.path.join(HERE, "stem_sfx.wav"), s_m, 24)
    mix_path = os.path.join(HERE, "mix.wav")
    write_wav(mix_path, mix, 24)

    L_out = integrated(mix)
    tp_out = true_peak(mix)
    lra_out = lra(mix)
    min_gr_db = 20 * np.log10(gr.min() + 1e-12)
    log(f"Mix written: {mix_path} | I={L_out:.2f} LUFS | LRA={lra_out:.2f} LU | TP={tp_out:.2f} dBTP | max GR={min_gr_db:.2f} dB")

    eb = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", mix_path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    summary = eb[eb.rfind("Summary:"):] if "Summary:" in eb else eb[-600:]

    lines = [
        "# Audio Mix & Cue Sheet — Sa Kabilang Oras (Part 1)",
        f"- Duration: {dur:.3f} s ({N} samples @ {SR} Hz stereo 24-bit)",
        f"- Integrated Loudness: {L_out:.2f} LUFS (target {TARGET_LUFS:.1f} LUFS)",
        f"- LRA: {lra_out:.2f} LU | True Peak: {tp_out:.2f} dBTP | Max Limiter GR: {min_gr_db:.2f} dB",
        f"- Stems (post-master, pre-limiter): voice={integrated(v_m):.2f} LUFS, music={integrated(m_m):.2f} LUFS, sfx={integrated(s_m):.2f} LUFS",
        "",
        "## Music Sections",
    ]
    for name, a, b in secs:
        lines.append(f"- `{name}` {a:5.2f}s - {b:5.2f}s (target {MUSIC_TARGET[name]:+.1f} LU rel voice, gain {gains_map[name]:+.1f} dB)")
    lines.append("\n## SFX Cues")
    for t_s, label, gain, p in sorted(cues):
        lines.append(f"- `t={t_s:6.3f}s` (f{round(t_s * fps):04d}) {label} (gain={gain:.2f}, pan={p:+.2f})")
    lines.append("\n## FFmpeg EBU R128 Verification\n```")
    lines.append(summary.strip())
    lines.append("```")

    with open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    log("Wrote audio/cues.md")


if __name__ == "__main__":
    main()

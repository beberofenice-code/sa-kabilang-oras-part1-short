#!/usr/bin/env python3
"""Frame-exact, deterministic 2K vertical stitcher for per-shot Remotion chunks.
Decodes each cached shot_XX.mp4 sequentially, blends crossfades with exact linear alpha
(zero FFmpeg nested xfade/concat PTS corruption), scales via Lanczos to 1440x2560, and
muxes audio/mix.wav cleanly at 256 kbps AAC.
"""
import argparse
import json
import os
import subprocess
import numpy as np

W_IN, H_IN = 720, 1280
W_OUT, H_OUT = 1440, 2560


def read_chunk_frames(path: str, expected: int) -> np.ndarray:
    cmd = [
        "ffmpeg", "-v", "error", "-i", path,
        "-vf", f"scale={W_IN}:{H_IN}:in_range=pc:out_range=pc",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    frame_bytes = W_IN * H_IN * 3
    n = len(raw) // frame_bytes
    assert n >= expected, f"{path}: expected >= {expected} frames, got {n}"
    return np.frombuffer(raw[: expected * frame_bytes], dtype=np.uint8).reshape(expected, H_IN, W_IN, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", default="out/kabilang/timeline.json")
    ap.add_argument("--chunks-dir", default="out/kabilang/chunks")
    ap.add_argument("--audio", default="audio/mix.wav")
    ap.add_argument("--out", default="out/kabilang/sa-kabilang-oras-part1-2k.mp4")
    args = ap.parse_args()

    tl = json.load(open(args.timeline, encoding="utf-8"))
    fps = int(tl["fps"])
    total = int(tl["total_frames"])
    shots = tl["shots"]

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-v", "warning",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W_IN}x{H_IN}", "-r", str(fps), "-i", "pipe:0",
        "-i", args.audio,
        "-map", "0:v:0", "-map", "1:a:0",
        "-vf", f"scale={W_OUT}:{H_OUT}:flags=lanczos,format=yuv420p,setsar=1",
        "-frames:v", str(total), "-t", f"{total / fps:.6f}", "-r", str(fps),
        "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        args.out,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None

    written = 0
    tail_overlap = None  # last `next_xf` frames of previous shot

    for i, s in enumerate(shots):
        sid = s["id"]
        xf = int(s.get("xfade", 0))
        next_xf = int(shots[i + 1].get("xfade", 0)) if i + 1 < len(shots) else 0
        dur = min(total, s["b"] + next_xf) - s["a"]
        chunk_path = os.path.join(args.chunks_dir, f"shot_{sid:02d}.mp4")
        frames = read_chunk_frames(chunk_path, dur)

        start_idx = 0
        if xf > 0 and tail_overlap is not None:
            k_n = min(xf, len(tail_overlap), len(frames))
            for k in range(k_n):
                alpha = (k + 1) / (k_n + 1)
                blended = np.clip(
                    np.round(tail_overlap[k].astype(np.float32) * (1.0 - alpha) + frames[k].astype(np.float32) * alpha),
                    0, 255,
                ).astype(np.uint8)
                proc.stdin.write(blended.tobytes())
                written += 1
            start_idx = k_n

        body_end = len(frames) - next_xf if next_xf > 0 else len(frames)
        if body_end > start_idx:
            proc.stdin.write(frames[start_idx:body_end].tobytes())
            written += body_end - start_idx

        tail_overlap = frames[body_end:].copy() if next_xf > 0 else None
        print(f"[stitch_2k] Shot {sid:02d}: chunk={len(frames)}f, xfade_in={xf}, xfade_out={next_xf}, total_written={written}/{total}", flush=True)

    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise SystemExit(f"ffmpeg exited with code {rc}")
    assert written == total, f"Expected {total} frames written, got {written}"
    print(f"[stitch_2k] SUCCESS: {args.out} ({written} frames = {written / fps:.2f}s @ {W_OUT}x{H_OUT})")


if __name__ == "__main__":
    main()

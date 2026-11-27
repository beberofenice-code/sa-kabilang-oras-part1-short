# Sa Kabilang Oras (Part 1)

A 78-second original Tagalog 2K vertical animated mystery-romance short (`1440×2560`, 30 fps) — **Part 1** of a serialized time-slip story designed to leave viewers asking for Part 2.

On a rainy night, **Mateo** is struck by a speeding car on the street—yet wakes up without a single scratch, his wristwatch frozen at the exact minute of the crash. No ambulance, no modern city—only a quiet timeless Filipino heritage town of cobblestone plazas, *Bahay na Bato* houses, and horse-drawn *kalesa*. Right in front of him kneels **Clara**, gently asking *"Okay ka lang?"* As days turn into weeks and months by the river, sunset stone bridge, and firefly-lit acacia tree, Mateo falls deeply in love—until a distant siren and hospital heartbeat pulse echo from the night sky, Clara's hand shimmers like smoke, and a faded 1970s library photograph reveals Clara in the exact same dress… with Mateo's own family crest on the back. Suddenly the plaza shakes as blinding headlights split the street open—*Sino ba talaga si Clara, at buhay pa ba si Mateo? Abangan sa Part Two.*

Built in **Three.js + Remotion** with flat 2D bean-head cartoon characters in 13 hand-painted 3D sets, world ink outlines, depth-aware bokeh, **ElevenLabs `eleven_v4`** Tagalog narration, and BS.1770-4 mastered original romantic/mystery score and frame-locked foley.

## Watch / Download 2K Master
- **Direct Download (Git LFS):** [sa-kabilang-oras-part1-2k.mp4](https://github.com/beberofenice-code/sa-kabilang-oras-part1-short/raw/v1.0.0/sa-kabilang-oras-part1-2k.mp4) (`135 MB`)
- **GitHub Release:** [`v1.0.0`](https://github.com/beberofenice-code/sa-kabilang-oras-part1-short/releases/tag/v1.0.0)
- **Video:** `1440×2560` (9:16 2K vertical), `30 fps`, `2,340` frames (`78.00 s`), H.264 `yuv420p` CRF 16 `+faststart`
- **Audio:** AAC `48 kHz` stereo `256 kbps`, ElevenLabs `eleven_v4` Tagalog narration + original mystery-romance score & 26 frame-locked SFX mastered to `-15.1 LUFS` / `LRA 3.1 LU` / `-1.1 dBFS` true peak (zero silences)
- **Captions:** None (clean, text-free visuals across all 13 shots)

## QA Summary
Verified frame-by-frame with `scripts/short_qa.py` (see [`QA_REPORT.md`](QA_REPORT.md)):
- `0` black frames
- `0` unplanned white frames
- `0` frozen spans (`>= 12` frames)
- `0%` held frames (`mean diff 5.57`)
- `0` audio silences (`-15.1 LUFS`, `-1.1 dBFS` peak)

## Project Structure
- [`SCRIPT.md`](SCRIPT.md) — Original 205-word Part 1 Tagalog narration script
- [`src/videos/kabilang/`](src/videos/kabilang/) — 13 hand-painted 3D sets (`build.ts`, `paint.ts`), Mateo/Clara/townsfolk bean-head cast + text-free FX cards (`toon.ts`, `cast.ts`), 5 lighting/grade presets (`lights.ts`, `grade.ts`), post-processing (`ink.ts`, `lensblur.ts`), and 13-shot master timeline (`story.ts`, `world.ts`, `KabilangShort.tsx`)
- [`audio/`](audio/) — Original synthesized Tagalog cinema mystery-romance score (`music.py`, `instruments.py`), frame-locked foley (`sfx.py`), BS.1770-4 master mixer (`mix.py`, `dsp.py`), and cue sheet (`cues.md`)
- [`scripts/`](scripts/) — ElevenLabs `eleven_v4` voice generator (`gen_voice_v4.py`), timeline exporter (`export_timeline.mjs`), per-shot resumable Remotion renderer & FFmpeg 2K stitcher (`render.mjs`), review grid builder (`make_review_grid.py`), and frame-by-frame QA (`short_qa.py`)

## Reproduce Locally
```bash
npm install
# 1. Generate Tagalog voice narration via ElevenLabs v4 (requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID)
python3 scripts/gen_voice_v4.py --script SCRIPT.md --out-dir voice --model eleven_v4 --speed 1.18
# 2. Export master timeline & mix audio
node scripts/export_timeline.mjs
python3 audio/mix.py
# 3. Render all 13 shots & stitch 2K vertical master
node scripts/render.mjs bundle --rebundle
node scripts/render.mjs render-shots --comp KabilangShort --timeline out/kabilang/timeline.json --audio audio/mix.wav --out out/kabilang/sa-kabilang-oras-part1-2k.mp4 --scale 2/3
# 4. Run frame-by-frame QA
python3 scripts/short_qa.py out/kabilang/sa-kabilang-oras-part1-2k.mp4 out/kabilang/qa out/kabilang/shots_qa.json
```

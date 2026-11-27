#!/usr/bin/env node
// Single-bundle, per-shot resumable Remotion renderer for Linux headless (swangle) & Desktop (angle).
// Supports:
//   bundle       --entry src/index.ts
//   stills       --comp KabilangShort --timeline out/kabilang/timeline.json --out out/kabilang/stills [--frames 10,200,...] [--scale 0.5]
//   render-shots --comp KabilangShort --timeline out/kabilang/timeline.json --audio audio/mix.wav --out out/kabilang/sa-kabilang-oras-part1-2k.mp4 [--scale 2/3] [--shots 1,2,...]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";

const args = process.argv.slice(2);
const mode = args[0] || "help";
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const entry = getArg("--entry", "src/index.ts");
const compId = getArg("--comp", "KabilangShort");
const bundleDir = path.resolve(getArg("--bundle-dir", ".remotion-bundle"));
const timelinePath = getArg("--timeline", "out/kabilang/timeline.json");
const audioPath = getArg("--audio", "");
const outPath = getArg("--out", "out/kabilang/sa-kabilang-oras-part1-2k.mp4");
const rawScale = getArg("--scale", "2/3");
const scale = rawScale === "4/3" || Math.abs(Number(rawScale) - 4 / 3) < 0.001
  ? 4 / 3
  : rawScale === "2/3" || Math.abs(Number(rawScale) - 2 / 3) < 0.001
  ? 2 / 3
  : Number(rawScale);
const outWidth = Number(getArg("--out-width", "1440"));
const outHeight = Number(getArg("--out-height", "2560"));
const framesArg = getArg("--frames", "");
const shotsArg = getArg("--shots", "");

function detectEnv() {
  const candidates = [
    process.env.BROWSER_EXECUTABLE,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);
  const browserExecutable = candidates.find((p) => fs.existsSync(p)) || undefined;
  const gl = getArg("--gl", process.env.REMOTION_GL || (process.platform === "linux" ? "swangle" : "angle"));
  const concurrency = Number(getArg("--concurrency", gl === "swangle" ? "2" : String(Math.max(1, Math.min(4, os.cpus().length >> 1)))));
  return { browserExecutable, gl, concurrency };
}

async function ensureBundle(force = false) {
  if (!force && fs.existsSync(path.join(bundleDir, "index.html"))) {
    console.log(`[render] Reusing cached bundle at ${bundleDir}`);
    return bundleDir;
  }
  console.log(`[render] Bundling ${entry} -> ${bundleDir} ...`);
  return await bundle({
    entryPoint: path.resolve(entry),
    publicDir: fs.existsSync("public") ? path.resolve("public") : null,
    outDir: bundleDir,
  });
}

async function run() {
  const env = detectEnv();
  console.log(`[render] mode=${mode} | GL=${env.gl} | concurrency=${env.concurrency} | scale=${scale} | chrome=${env.browserExecutable}`);
  const serveUrl = await ensureBundle(mode === "bundle" || args.includes("--rebundle"));
  if (mode === "bundle") return;

  const tl = JSON.parse(fs.readFileSync(timelinePath, "utf8"));
  const chromiumOptions = { gl: env.gl };
  const composition = await selectComposition({
    serveUrl,
    id: compId,
    browserExecutable: env.browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 180000,
  });

  if (mode === "stills") {
    fs.mkdirSync(outPath, { recursive: true });
    const list = framesArg
      ? framesArg.split(",").map((s) => {
          const f = Number(s.trim());
          const sh = tl.shots.find((x) => f >= x.a && f < x.b) || tl.shots[tl.shots.length - 1];
          return { id: sh.id, f };
        })
      : tl.shots.map((s) => ({ id: s.id, f: Math.floor((s.a + s.b) / 2) }));

    for (const item of list) {
      const file = path.join(outPath, `shot_${String(item.id).padStart(2, "0")}_f${String(item.f).padStart(4, "0")}.jpg`);
      await renderStill({
        composition,
        serveUrl,
        frame: item.f,
        scale: Number(getArg("--scale", "0.5")),
        imageFormat: "jpeg",
        jpegQuality: 90,
        output: file,
        inputProps: { shotId: item.id },
        browserExecutable: env.browserExecutable,
        chromiumOptions,
        timeoutInMilliseconds: 180000,
      });
      console.log(`[stills] Shot ${item.id} f=${item.f} -> ${file}`);
    }
    return;
  }

  if (mode === "render-shots") {
    const chunksDir = path.join(path.dirname(outPath), "chunks");
    fs.mkdirSync(chunksDir, { recursive: true });
    const onlyShots = shotsArg ? new Set(shotsArg.split(",").map((x) => Number(x.trim()))) : null;
    const maxFrames = Number(getArg("--max-frames", "0"));
    const chunkFiles = [];

    for (let i = 0; i < tl.shots.length; i++) {
      const s = tl.shots[i];
      const nextXfade = tl.shots[i + 1]?.xfade ?? 0;
      const startFrame = s.a;
      const fullEnd = Math.min(tl.total_frames - 1, s.b - 1 + nextXfade);
      const endFrame = maxFrames > 0 ? Math.min(fullEnd, startFrame + maxFrames - 1) : fullEnd;
      const chunkFile = path.join(chunksDir, `shot_${String(s.id).padStart(2, "0")}.mp4`);
      chunkFiles.push({ file: chunkFile, shot: s, durFrames: endFrame - startFrame + 1, nextXfade });

      if (onlyShots && !onlyShots.has(s.id)) continue;
      if (fs.existsSync(chunkFile) && !args.includes("--force")) {
        console.log(`[render-shots] Cached Shot ${s.id} (${chunkFile})`);
        continue;
      }

      const t0 = Date.now();
      const totalF = endFrame - startFrame + 1;
      console.log(`[render-shots] Rendering Shot ${s.id}: frames ${startFrame}..${endFrame} (${totalF} f) @ scale=${scale} ...`);
      let lastLog = 0;
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        crf: 16,
        scale,
        imageFormat: "jpeg",
        jpegQuality: 95,
        frameRange: [startFrame, endFrame],
        concurrency: env.concurrency,
        outputLocation: chunkFile,
        inputProps: { shotId: s.id },
        browserExecutable: env.browserExecutable,
        chromiumOptions,
        timeoutInMilliseconds: 180000,
        onProgress: ({ renderedFrames }) => {
          if (renderedFrames - lastLog >= 20 || renderedFrames === totalF) {
            lastLog = renderedFrames;
            const dt = (Date.now() - t0) / 1000;
            console.log(`  [Shot ${s.id}] ${renderedFrames}/${totalF} f (${(renderedFrames / Math.max(dt, 0.1)).toFixed(2)} fps, ${dt.toFixed(1)}s)`);
          }
        },
      });
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[render-shots] Shot ${s.id} done in ${dt}s (${(totalF / Number(dt)).toFixed(2)} fps)`);
    }

    if (!onlyShots || args.includes("--stitch")) {
      stitchChunks(chunkFiles, tl.fps, audioPath, outPath, tl.total_frames);
    }
  }
}

function stitchChunks(chunks, fps, audioFile, finalOut, totalFrames) {
  fs.mkdirSync(path.dirname(finalOut), { recursive: true });
  const inputs = chunks.flatMap((c) => ["-reinit_filter", "0", "-i", c.file]);
  const parts = chunks.map(
    (_, i) => `[${i}:v]scale=in_range=pc:out_range=tv,format=yuv420p,setsar=1,setpts=PTS-STARTPTS,fps=${fps},settb=1/${fps}[n${i}]`
  );
  let acc = "[n0]";
  let cumulativeFrames = chunks[0].durFrames;
  for (let i = 1; i < chunks.length; i++) {
    const xf = chunks[i].shot.xfade || 0;
    const out = `[v${i}]`;
    if (xf > 0) {
      parts.push(
        `${acc}[n${i}]xfade=transition=fade:duration=${(xf / fps).toFixed(6)}:offset=${((cumulativeFrames - xf) / fps).toFixed(6)},settb=1/${fps}${out}`
      );
      cumulativeFrames += chunks[i].durFrames - xf;
    } else {
      parts.push(`${acc}[n${i}]concat=n=2:v=1:a=0,settb=1/${fps}${out}`);
      cumulativeFrames += chunks[i].durFrames;
    }
    acc = out;
  }
  const finalLabel = "[vout]";
  parts.push(`${acc}scale=${outWidth}:${outHeight}:flags=lanczos,format=yuv420p,setsar=1${finalLabel}`);
  const frames = totalFrames ?? cumulativeFrames;
  const ffArgs = ["-y", ...inputs];
  const withAudio = audioFile && fs.existsSync(audioFile);
  if (withAudio) ffArgs.push("-i", audioFile);
  ffArgs.push("-filter_complex", parts.join(";"), "-map", finalLabel);
  if (withAudio) ffArgs.push("-map", `${chunks.length}:a:0`, "-c:a", "aac", "-b:a", "256k");
  else ffArgs.push("-an");
  ffArgs.push(
    "-frames:v", String(frames),
    "-t", (frames / fps).toFixed(6),
    "-r", String(fps),
    "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    finalOut
  );
  console.log(`[stitch] ${chunks.length} shots -> ${frames} frames (${(frames / fps).toFixed(2)}s) @ ${outWidth}x${outHeight} -> ${finalOut}`);
  execFileSync("ffmpeg", ["-v", "warning", ...ffArgs], { stdio: "inherit" });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

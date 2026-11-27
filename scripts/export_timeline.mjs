#!/usr/bin/env node
// Exports story.ts timeline -> out/kabilang/timeline.json and out/kabilang/shots_qa.json
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const storyPath = path.resolve(process.argv[2] || "src/videos/kabilang/story.ts");
const outDir = path.resolve(process.argv[3] || "out/kabilang");
fs.mkdirSync(outDir, { recursive: true });

// Compile story.ts via TypeScript (no esbuild binary dependency issues)
const tmpDir = path.join(outDir, "_story_tsc");
fs.mkdirSync(tmpDir, { recursive: true });
execFileSync("npx", ["tsc", storyPath, "--module", "esnext", "--target", "es2022", "--moduleResolution", "bundler", "--outDir", tmpDir, "--skipLibCheck"], { stdio: "inherit" });
const compiledJs = path.join(tmpDir, "story.js");
const tmpMjs = path.join(outDir, "_story_tmp.mjs");
fs.copyFileSync(compiledJs, tmpMjs);
fs.rmSync(tmpDir, { recursive: true, force: true });

const mod = await import(pathToFileURL(tmpMjs).href);
fs.unlinkSync(tmpMjs);

const timeline = {
  fps: mod.FPS,
  total_frames: mod.TOTAL,
  duration_s: mod.TOTAL / mod.FPS,
  shots: mod.SHOTS.map((s) => ({
    id: s.id,
    a: s.a,
    b: s.b,
    light: s.light,
    set: s.set,
    xfade: s.xfade || 0,
  })),
  flashes: mod.FLASHES.map((fl) => ({ f: fl.f, dur: fl.curve.length })),
  kicks: mod.KICKS,
  events: {
    F_CAR_APPROACH: mod.F_CAR_APPROACH,
    F_CAR_IMPACT: mod.F_CAR_IMPACT,
    F_WAKE_UP: mod.F_WAKE_UP,
    F_NO_SCRATCH: mod.F_NO_SCRATCH,
    F_NO_AMBULANCE: mod.F_NO_AMBULANCE,
    F_NO_CITY: mod.F_NO_CITY,
    F_WATCH_STOP: mod.F_WATCH_STOP,
    F_KALESA: mod.F_KALESA,
    F_OLD_HOUSES: mod.F_OLD_HOUSES,
    F_QUIET_PLAZA: mod.F_QUIET_PLAZA,
    F_LOOK_AROUND: mod.F_LOOK_AROUND,
    F_CLARA_APPEAR: mod.F_CLARA_APPEAR,
    F_OKAY_KA_LANG: mod.F_OKAY_KA_LANG,
    F_CLARA_NAME: mod.F_CLARA_NAME,
    F_TOWN_WALK: mod.F_TOWN_WALK,
    F_NOTICE_CLOCK: mod.F_NOTICE_CLOCK,
    F_CLOCK_FROZEN: mod.F_CLOCK_FROZEN,
    F_DAYS_PASS: mod.F_DAYS_PASS,
    F_MONTHS_STAY: mod.F_MONTHS_STAY,
    F_RIVER_WALK: mod.F_RIVER_WALK,
    F_BRIDGE_SUNSET: mod.F_BRIDGE_SUNSET,
    F_TREE_LAUGH: mod.F_TREE_LAUGH,
    F_FALL_IN_LOVE: mod.F_FALL_IN_LOVE,
    F_STAY_FOREVER: mod.F_STAY_FOREVER,
    F_SKY_SIREN: mod.F_SKY_SIREN,
    F_HEART_MACHINE: mod.F_HEART_MACHINE,
    F_HOLD_HAND: mod.F_HOLD_HAND,
    F_HAND_GLOW: mod.F_HAND_GLOW,
    F_FADE_SMOKE: mod.F_FADE_SMOKE,
    F_LIBRARY_FIND: mod.F_LIBRARY_FIND,
    F_OLD_PHOTO: mod.F_OLD_PHOTO,
    F_PHOTO_CLARA: mod.F_PHOTO_CLARA,
    F_PHOTO_BACK: mod.F_PHOTO_BACK,
    F_ROAD_QUAKE: mod.F_ROAD_QUAKE,
    F_LIGHT_OPEN: mod.F_LIGHT_OPEN,
    F_HEADLIGHT_GLARE: mod.F_HEADLIGHT_GLARE,
    F_WHO_IS_CLARA: mod.F_WHO_IS_CLARA,
    F_IS_MATEO_ALIVE: mod.F_IS_MATEO_ALIVE,
    F_PART_TWO: mod.F_PART_TWO,
  },
};

fs.writeFileSync(path.join(outDir, "timeline.json"), JSON.stringify(timeline, null, 2));

const xfadeRanges = [];
for (const s of mod.SHOTS) {
  if (s.xfade) xfadeRanges.push([Math.max(0, s.a - s.xfade), Math.min(mod.TOTAL, s.a + s.xfade)]);
}
const planned = mod.FLASHES.map((fl) => [fl.f, fl.f + fl.curve.length + 1]);
for (const [kf] of mod.KICKS) planned.push([kf - 1, kf + 9]);

const qaMeta = {
  shots: mod.SHOTS.map((s) => ({ id: s.id, a: s.a, b: s.b })),
  xfade: xfadeRanges,
  planned,
};
fs.writeFileSync(path.join(outDir, "shots_qa.json"), JSON.stringify(qaMeta, null, 2));
console.log(`[export_timeline] Wrote ${outDir}/timeline.json & shots_qa.json (${mod.SHOTS.length} shots, ${mod.TOTAL} frames = ${(mod.TOTAL / mod.FPS).toFixed(2)} s)`);

#!/usr/bin/env python3
"""Original synthesized soundtrack for 'Sa Kabilang Oras (Part 1)'.
An emotional, atmospheric Tagalog cinema time-slip & romance score:
- Tense night-road ticking pulse -> impact silence -> shimmering music-box awakening
- Warm nostalgic Filipino harana-inspired plucked acoustic & vibraphone motif for Clara ("Okay ka lang?")
- Sweeping bittersweet romantic arc (hillside, river, sunset bridge, firefly acacia tree)
- Haunting minor transition (sky siren & fading hand), intimate 1970s library mystery sting,
  and a soaring timpani + brass + music-box cliffhanger crescendo ("Abangan sa Part Two")!
"""
import numpy as np
from dsp import SR, ns, rng, pan, place, make_ir, convolve_st, lp, hp, fades
from instruments import m2f, brass, fife, glock, vibes, musicbox, triangle, cymbal, timpani, brush, pluck, pad


def build_sections(tl):
    fps = tl["fps"]
    shots = {s["id"]: s for s in tl["shots"]}
    t = lambda sid, k="a": shots[sid][k] / fps
    dur = float(tl["duration_s"])
    return [
        ("crash",      t(1, "a"),  t(2, "a")),   # Shot 1: Night crash -> unharmed awakening
        ("awakening",  t(2, "a"),  t(3, "a")),   # Shot 2: Quiet golden dawn & frozen watch
        ("old_era",    t(3, "a"),  t(4, "a")),   # Shot 3: Sunlit vintage plaza & kalesa
        ("clara",      t(4, "a"),  t(6, "a")),   # Shots 4-5: Clara ("Okay ka lang?") & old town walk
        ("clock",      t(6, "a"),  t(7, "a")),   # Shot 6: Stopped clock tower clue
        ("montage",    t(7, "a"),  t(9, "a")),   # Shots 7-8: Days passing, river, sunset bridge, acacia laugh
        ("in_love",    t(9, "a"),  t(10, "a")),  # Shot 9: Falling deeply in love under fireflies
        ("crack",      t(10, "a"), t(11, "a")),  # Shot 10: Sky siren, heart machine & Clara fading like smoke
        ("library",    t(11, "a"), t(13, "a")),  # Shots 11-12: 1970s photo & family surname crest reveal
        ("cliffhanger", t(13, "a"), dur),        # Shot 13: Quake, headlight portal & Part 1 cliffhanger!
    ]


def render_music(tl):
    r = rng(1977)
    dur = float(tl["duration_s"])
    fps = tl["fps"]
    ev = tl["events"]
    N = ns(dur)
    dry = np.zeros((2, N))
    wet = np.zeros((2, N))

    def add(sig, t_s, gain=1.0, p=0.0, rev=0.30):
        if t_s < 0 or t_s >= dur - 0.02:
            return
        st_sig = pan(sig, p) if sig.ndim == 1 else sig
        place(dry, st_sig, t_s, gain)
        if rev > 0:
            place(wet, st_sig, t_s, gain * rev)

    secs = dict((name, (a, b)) for name, a, b in build_sections(tl))

    # --- 1. CRASH & UNHARMED AWAKENING (D minor suspense -> impact drop -> fragile musicbox) ---
    a, b = secs["crash"]
    t_imp = ev["F_CAR_IMPACT"] / fps
    t_wake = ev["F_WAKE_UP"] / fps
    add(pad([m2f(50), m2f(57), m2f(62), m2f(65)], max(0.8, t_imp - a), 0.50, r, att=0.15, rel=0.18, warm=680), a, 0.42, 0.0, 0.36)
    t = a + 0.04
    i = 0
    while t < t_imp - 0.08:
        add(pluck(m2f(50 if i % 2 == 0 else 53), 0.58, r, dur=0.35), t, 0.38, -0.18, 0.22)
        add(timpani(m2f(38), 0.45 + 0.35 * ((t - a) / max(0.5, t_imp - a)), r, dur=0.55), t, 0.36, 0.0, 0.28)
        t += 0.38
        i += 1
    # After impact: airy mysterious awakening shimmer
    add(pad([m2f(50), m2f(57), m2f(64), m2f(69)], max(1.0, b - t_wake), 0.46, r, att=0.45, rel=0.45, warm=920), t_wake - 0.1, 0.42, 0.0, 0.48)
    for k, note in enumerate([74, 76, 81, 79, 76, 74]):
        add(musicbox(m2f(note), 0.56, r, dur=1.4), t_wake + k * 0.55, 0.36, -0.22 + 0.1 * k, 0.46)

    # --- 2. AWAKENING IN GOLDEN DAWN & FROZEN WATCH (A minor / F major7 wonder) ---
    a, b = secs["awakening"]
    add(pad([m2f(45), m2f(53), m2f(60), m2f(64)], max(1.0, b - a), 0.46, r, att=0.3, rel=0.4, warm=880), a, 0.42, 0.0, 0.44)
    mel = [72, 76, 79, 76, 74, 72, 69, 72, 76, 74, 72]
    bass = [45, 52, 41, 48, 43, 50, 45, 52, 41, 48, 45]
    t, i = a + 0.08, 0
    while t < b - 0.12:
        add(pluck(m2f(bass[i % len(bass)]), 0.58, r, dur=0.55), t, 0.40, -0.25, 0.26)
        add(vibes(m2f(mel[i % len(mel)]), 0.54, r, dur=1.15), t, 0.40, 0.24, 0.42)
        if i % 2 == 1:
            add(musicbox(m2f(mel[i % len(mel)] + 12), 0.48, r, dur=0.9), t + 0.24, 0.26, -0.32, 0.44)
        t += 0.48
        i += 1

    # --- 3. OLD ERA — VINTAGE PLAZA & KALESA (Warm nostalgic F major harana waltz!) ---
    a, b = secs["old_era"]
    add(pad([m2f(53), m2f(57), m2f(60), m2f(65)], max(1.0, b - a), 0.42, r, att=0.3, rel=0.4, warm=950), a, 0.34, 0.0, 0.36)
    waltz_bass = [41, 48, 53, 45, 52, 57, 46, 53, 58, 48, 55, 60]
    waltz_mel = [69, 72, 77, 76, 74, 72, 70, 72, 74, 72, 69, 65]
    t, i = a + 0.05, 0
    while t < b - 0.10:
        add(pluck(m2f(waltz_bass[i % len(waltz_bass)]), 0.62 if i % 3 == 0 else 0.48, r, dur=0.55), t, 0.46, -0.24, 0.25)
        add(pluck(m2f(waltz_mel[i % len(waltz_mel)]), 0.54, r, dur=0.65), t + 0.16, 0.38, 0.24, 0.30)
        if i % 3 == 0:
            add(vibes(m2f(waltz_mel[i % len(waltz_mel)]), 0.56, r, dur=1.1), t, 0.38, 0.12, 0.38)
        t += 0.44
        i += 1

    # --- 4. CLARA ("Okay ka lang?") & OLD TOWN WALK (Tender glowing Clara theme in F major!) ---
    a, b = secs["clara"]
    t_ok = ev["F_OKAY_KA_LANG"] / fps
    add(pad([m2f(53), m2f(60), m2f(64), m2f(69)], max(1.0, b - a), 0.48, r, att=0.4, rel=0.45, warm=1020), a, 0.44, 0.0, 0.45)
    clara_mel = [77, 76, 72, 69, 72, 74, 76, 79, 77, 76, 72, 74, 72, 69, 65, 69, 72, 76]
    clara_bass = [41, 48, 45, 52, 46, 53, 48, 55, 41, 48, 43, 50, 48, 55, 41, 48, 45, 52]
    t, i = a + 0.06, 0
    while t < b - 0.12:
        add(pluck(m2f(clara_bass[i % len(clara_bass)]), 0.62, r, dur=0.6), t, 0.44, -0.22, 0.26)
        add(vibes(m2f(clara_mel[i % len(clara_mel)]), 0.58, r, dur=1.1), t, 0.42, 0.20, 0.40)
        if i % 2 == 0:
            add(musicbox(m2f(clara_mel[i % len(clara_mel)] + 12), 0.54, r, dur=1.0), t + 0.22, 0.32, -0.26, 0.42)
        if i % 3 == 0:
            add(fife(m2f(clara_mel[i % len(clara_mel)]), 0.36, 0.38, r), t, 0.22, 0.28, 0.36)
        t += 0.46
        i += 1
    # Delicate glock shimmer right on Clara's "Okay ka lang?"
    add(glock(m2f(84), 0.52, r, dur=1.5), t_ok - 0.08, 0.28, 0.18, 0.48)
    add(glock(m2f(89), 0.56, r, dur=1.8), t_ok + 0.14, 0.30, -0.18, 0.50)

    # --- 5. STOPPED CLOCK TOWER CLUE (Subtle mysterious suspended minor chord) ---
    a, b = secs["clock"]
    t_clk = ev["F_CLOCK_FROZEN"] / fps
    add(pad([m2f(50), m2f(57), m2f(64), m2f(65)], max(1.0, b - a), 0.50, r, att=0.25, rel=0.4, warm=740), a, 0.44, 0.0, 0.46)
    for k, note in enumerate([74, 77, 76, 74, 72, 69, 74]):
        add(vibes(m2f(note), 0.54, r, dur=1.2), a + 0.12 + k * 0.54, 0.40, -0.2 + 0.08 * k, 0.44)
    add(glock(m2f(76), 0.48, r, dur=1.6), t_clk, 0.28, 0.0, 0.52)

    # --- 6. ROMANTIC MONTAGE — DAYS PASSING, RIVER, SUNSET BRIDGE, ACACIA TREE (Lush soaring G major!) ---
    a, b = secs["montage"]
    add(pad([m2f(43), m2f(55), m2f(59), m2f(66)], max(1.0, (b - a) * 0.52), 0.50, r, att=0.4, rel=0.5, warm=1080), a, 0.44, 0.0, 0.44)
    add(pad([m2f(48), m2f(55), m2f(60), m2f(67)], max(1.0, (b - a) * 0.52), 0.52, r, att=0.4, rel=0.5, warm=1120), a + (b - a) * 0.48, 0.46, 0.0, 0.46)
    rom_mel = [71, 74, 79, 78, 76, 74, 71, 72, 76, 79, 81, 79, 78, 74, 76, 79, 83, 81, 79, 76, 74, 71]
    rom_bass = [43, 50, 47, 54, 48, 55, 50, 57, 43, 50, 48, 55, 45, 52, 50, 57]
    t, i = a + 0.06, 0
    while t < b - 0.12:
        add(pluck(m2f(rom_bass[i % len(rom_bass)]), 0.64, r, dur=0.62), t, 0.46, -0.25, 0.26)
        add(pluck(m2f(rom_mel[i % len(rom_mel)] - 12), 0.52, r, dur=0.52), t + 0.21, 0.36, 0.26, 0.30)
        add(vibes(m2f(rom_mel[i % len(rom_mel)]), 0.60, r, dur=1.15), t, 0.44, 0.18, 0.40)
        if i % 2 == 0:
            add(musicbox(m2f(rom_mel[i % len(rom_mel)] + 12), 0.52, r, dur=0.95), t + 0.21, 0.28, -0.28, 0.44)
        add(brush(0.32, r, swish=(i % 2 == 1)), t, 0.18, 0.12, 0.16)
        t += 0.42
        i += 1

    # --- 7. FALLING DEEPLY IN LOVE UNDER FIREFLIES (Tender dreamy E minor -> G major swell!) ---
    a, b = secs["in_love"]
    add(pad([m2f(52), m2f(59), m2f(66), m2f(67)], max(1.0, b - a), 0.54, r, att=0.45, rel=0.5, warm=1020), a, 0.48, 0.0, 0.48)
    love_mel = [79, 78, 74, 71, 74, 76, 79, 83, 81, 79, 76, 74]
    love_bass = [40, 47, 48, 55, 43, 50, 45, 52]
    t, i = a + 0.08, 0
    while t < b - 0.12:
        add(pluck(m2f(love_bass[i % len(love_bass)]), 0.58, r, dur=0.72), t, 0.42, -0.22, 0.30)
        add(vibes(m2f(love_mel[i % len(love_mel)]), 0.58, r, dur=1.4), t, 0.44, 0.20, 0.46)
        add(musicbox(m2f(love_mel[i % len(love_mel)] + 12), 0.56, r, dur=1.2), t + 0.25, 0.34, -0.26, 0.48)
        if i % 3 == 0:
            add(triangle(0.26, r, dur=1.0), t, 0.16, 0.32, 0.42)
        t += 0.50
        i += 1

    # --- 8. CRACKS IN REALITY — SKY SIREN & FADING HAND (Haunting dark D minor / B-flat tension) ---
    a, b = secs["crack"]
    t_glow = ev["F_HAND_GLOW"] / fps
    add(pad([m2f(50), m2f(57), m2f(61), m2f(65)], max(1.0, b - a), 0.52, r, att=0.5, rel=0.5, warm=640), a, 0.46, 0.0, 0.46)
    dark_mel = [74, 73, 69, 65, 69, 70, 74, 76, 74, 70, 69, 65]
    dark_bass = [38, 45, 46, 45, 38, 45, 43, 45]
    t, i = a + 0.10, 0
    while t < b - 0.12:
        add(pluck(m2f(dark_bass[i % len(dark_bass)]), 0.62, r, dur=0.65), t, 0.44, -0.20, 0.28)
        add(vibes(m2f(dark_mel[i % len(dark_mel)]), 0.52, r, dur=1.3), t, 0.38, 0.24, 0.44)
        if i % 2 == 0:
            add(timpani(m2f(38), 0.44, r, dur=0.8), t, 0.34, 0.0, 0.34)
        t += 0.54
        i += 1
    # Ethereal shimmer chord on Clara's glowing/fading hand!
    add(glock(m2f(81), 0.56, r, dur=1.8), t_glow, 0.32, 0.22, 0.54)
    add(glock(m2f(86), 0.58, r, dur=2.0), t_glow + 0.16, 0.34, -0.22, 0.56)

    # --- 9. 1970s LIBRARY PHOTO & FAMILY SURNAME REVEAL (Intimate suspense -> sharp twist chord!) ---
    a, b = secs["library"]
    t_back = ev["F_PHOTO_BACK"] / fps
    add(pad([m2f(45), m2f(52), m2f(60), m2f(64)], max(1.0, b - a), 0.48, r, att=0.4, rel=0.4, warm=760), a, 0.44, 0.0, 0.44)
    lib_mel = [69, 72, 76, 74, 72, 71, 69, 72, 76, 79, 77, 76, 74, 72, 71, 69]
    t, i = a + 0.10, 0
    while t < b - 0.12:
        add(musicbox(m2f(lib_mel[i % len(lib_mel)] + 12), 0.56, r, dur=1.2), t, 0.36, -0.24, 0.46)
        add(pluck(m2f(45 if i % 4 < 2 else 41), 0.62, r, dur=0.6), t, 0.44, 0.20, 0.26)
        if t >= t_back - 0.12:
            add(timpani(m2f(41), 0.66, r, dur=0.9), t, 0.46, 0.0, 0.36)
        t += 0.50
        i += 1
    # Sharp dramatic chord reveal on Mateo's surname on the back of the 1970s photo!
    add(brass(m2f(45), 1.4, 0.72, r, kind="horn"), t_back - 0.02, 0.38, -0.22, 0.42)
    add(brass(m2f(52), 1.4, 0.68, r, kind="horn"), t_back - 0.02, 0.34, 0.22, 0.42)
    add(glock(m2f(81), 0.64, r, dur=1.8), t_back, 0.34, 0.0, 0.52)

    # --- 10. PART 1 CLIFFHANGER — QUAKE, BLINDING HEADLIGHT PORTAL & "ABANGAN SA PART TWO" ---
    a, b = secs["cliffhanger"]
    t_open = ev["F_LIGHT_OPEN"] / fps
    t_p2 = ev["F_PART_TWO"] / fps
    add(pad([m2f(50), m2f(57), m2f(62), m2f(69)], max(1.0, b - a), 0.60, r, att=0.35, rel=0.8, warm=1060), a, 0.52, 0.0, 0.48)
    fin_mel = [74, 76, 77, 81, 86, 84, 81, 79, 77, 76, 74, 77, 81, 86, 88, 86]
    fin_bass = [38, 45, 46, 48, 50, 48, 46, 45]
    t, i = a + 0.05, 0
    while t < b - 0.55:
        add(timpani(m2f(fin_bass[i % len(fin_bass)]), 0.68, r, dur=0.75), t, 0.48, 0.0, 0.34)
        add(pluck(m2f(fin_bass[i % len(fin_bass)] + 12), 0.66, r, dur=0.55), t, 0.44, -0.22, 0.26)
        add(vibes(m2f(fin_mel[i % len(fin_mel)]), 0.62, r, dur=1.25), t, 0.44, 0.22, 0.42)
        add(musicbox(m2f(fin_mel[i % len(fin_mel)] + 12), 0.56, r, dur=1.1), t + 0.22, 0.34, -0.28, 0.46)
        if i % 2 == 0 and t >= t_open - 0.2:
            add(brass(m2f(fin_bass[i % len(fin_bass)] + 12), 0.72, 0.68, r, kind="horn"), t, 0.34, -0.18, 0.36)
        t += 0.45
        i += 1
    # Final haunting cliffhanger button on "Abangan sa Part Two."
    add(cymbal(0.68, r, dur=2.2), t_open, 0.28, 0.0, 0.48)
    add(brass(m2f(50), 1.8, 0.72, r, kind="soft"), t_p2 - 0.05, 0.42, 0.0, 0.46)
    add(vibes(m2f(74), 0.70, r, dur=2.2), t_p2, 0.48, 0.20, 0.52)
    add(glock(m2f(86), 0.66, r, dur=2.2), t_p2 + 0.14, 0.38, -0.20, 0.56)
    add(musicbox(m2f(81), 0.62, r, dur=2.4), t_p2 + 0.45, 0.38, 0.0, 0.58)

    ir = make_ir(1.20, seed=77, pre=0.016, hf=1.1, density_lp=5500)
    out = dry + convolve_st(wet, ir) * 0.52
    out = hp(out, 32)
    out = lp(out, 14500)
    return fades(out, 0.02, 0.22)

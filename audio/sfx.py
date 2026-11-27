#!/usr/bin/env python3
"""Procedural frame-locked foley & atmospheric SFX for 'Sa Kabilang Oras (Part 1)'.
Every cue is tied directly to out/kabilang/timeline.json events so sound effects lock
tightly to the visual impact, frozen watch, kalesa, Clara's reveal, stopped clock tower,
sky siren & hospital heart-monitor pulse, fading smoke, 1970s photo flip, and cliffhanger rift!
"""
import numpy as np
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, pan, place, fades, smooth_noise, modal, make_ir, convolve_st


def sfx_rain(dur, r):
    n = ns(dur)
    nz = r.standard_normal(n)
    return fades(bp(nz, 600, 5200, 2) * 0.22 + lp(nz, 380) * 0.12, 0.15, 0.25)


def sfx_car_screech_crash(r):
    # High tire screech + car horn Doppler + heavy cinematic crash impact + flash whoosh!
    dur = 1.55
    t = tt(dur)
    screech = np.sin(TAU * (1620 - 380 * np.clip(t / 0.52, 0, 1)) * t + 12 * np.sin(TAU * 42 * t)) * np.exp(-np.maximum(0, t - 0.15) / 0.28) * (t < 0.60)
    horn = (np.sin(TAU * 415 * t) + 0.7 * np.sin(TAU * 523 * t)) * np.exp(-np.maximum(0, t - 0.1) / 0.42) * (t < 0.58)
    # Impact thump right at t = 0.54s
    ti = np.maximum(0.0, t - 0.54)
    hit_mask = (t >= 0.54).astype(float)
    thump = np.sin(TAU * (120 * np.exp(-ti / 0.08) + 38) * ti) * np.exp(-ti / 0.28) * hit_mask
    whoosh = bp(r.standard_normal(len(t)), 220, 3200, 2) * np.exp(-ti / 0.36) * hit_mask
    shimmer = np.sin(TAU * 1318 * ti) * np.exp(-ti / 0.55) * hit_mask * 0.24
    return fades(0.28 * screech + 0.26 * horn + 0.95 * thump + 0.55 * whoosh + shimmer, 0.01, 0.25)


def sfx_dawn_breeze(dur, r):
    n = ns(dur)
    nz = r.standard_normal(n)
    env = 0.6 + 0.4 * smooth_noise(n, r, 0.7)
    return fades(bp(nz, 240, 1400, 2) * env * 0.20, 0.2, 0.3)


def sfx_watch_stop(r):
    # Two crisp watch ticks then a tiny frozen stutter click!
    dur = 1.15
    y = np.zeros(ns(dur))
    for ts, amp in [(0.05, 0.55), (0.45, 0.52), (0.85, 0.28), (0.91, 0.18)]:
        tk = hp(r.standard_normal(ns(0.025)), 2400) * np.exp(-tt(0.025) / 0.004)
        p0 = ns(ts)
        y[p0:p0 + len(tk)] += tk * amp
    return fades(y, 0.002, 0.05)


def sfx_kalesa_hooves(dur, r):
    # Classic rhythmic horse clip-clop on cobblestones + wooden carriage creak
    y = np.zeros(ns(dur))
    t = 0.10
    step = 0
    while t < dur - 0.2:
        freq = 540 if step % 2 == 0 else 660
        clop = bp(r.standard_normal(ns(0.055)), freq * 0.6, freq * 1.9, 2) * np.exp(-tt(0.055) / 0.012)
        p0 = ns(t)
        if p0 + len(clop) < len(y):
            y[p0:p0 + len(clop)] += clop * (0.42 if step % 2 == 0 else 0.30)
        t += 0.23 if step % 2 == 0 else 0.34
        step += 1
    return fades(y, 0.05, 0.15)


def sfx_chime_warm(r, f0=1046.5):
    dur = 1.35
    y = modal(dur, [(f0, 1.0, 0.85), (f0 * 1.5, 0.45, 0.70), (f0 * 2.0, 0.30, 0.55)], r)
    return fades(y * 0.45, 0.004, 0.12)


def sfx_clock_clunk(r):
    # Giant heavy bronze tower clock gear clunk + hollow bell resonance
    dur = 1.6
    t = tt(dur)
    clunk = lp(r.standard_normal(len(t)), 420) * np.exp(-t / 0.045) * 0.72
    bell = modal(dur, [(220.0, 0.9, 1.15), (440.0, 0.45, 0.75), (659.3, 0.25, 0.45)], r) * 0.52
    return fades(clunk + bell, 0.003, 0.18)


def sfx_river_bed(dur, r):
    n = ns(dur)
    nz = r.standard_normal(n)
    mod = 0.7 + 0.3 * smooth_noise(n, r, 1.1)
    return fades(bp(nz, 280, 2200, 2) * mod * 0.22, 0.25, 0.35)


def sfx_distant_siren(dur, r):
    # Eerie far-away muffled ambulance siren echoing through the night clouds
    t = tt(dur)
    f = 620 + 210 * np.sin(TAU * 0.72 * t)
    ph = np.cumsum(f) / SR * TAU
    sig = (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.sin(np.pi * np.clip(t / dur, 0, 1))
    return fades(lp(sig, 1150) * 0.32, 0.2, 0.3)


def sfx_ecg_beeps(dur, r):
    # Iconic subtle distant hospital heart-monitor beep... beep... beep!
    y = np.zeros(ns(dur))
    for ts in np.arange(0.12, dur - 0.2, 0.92):
        bt = tt(0.14)
        beep = np.sin(TAU * 988.0 * bt) * fades(np.ones(len(bt)), 0.008, 0.03)
        p0 = ns(ts)
        if p0 + len(beep) < len(y):
            y[p0:p0 + len(beep)] += beep * 0.38
    return y


def sfx_smoke_fade(r):
    # Shimmering ethereal air-whoosh as Clara's hand dissolves like light/smoke
    dur = 1.45
    t = tt(dur)
    air = bp(r.standard_normal(len(t)), 500, 4200, 2) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.4
    shimmer = modal(dur, [(1174.7, 0.5, 0.9), (1760.0, 0.35, 0.75)], r) * 0.32
    return fades(air * 0.45 + shimmer, 0.05, 0.25)


def sfx_page_flip(r):
    dur = 0.42
    t = tt(dur)
    crisp = bp(r.standard_normal(len(t)), 900, 5600, 2) * np.exp(-((t - 0.14) / 0.065) ** 2)
    snap = hp(r.standard_normal(len(t)), 1800) * np.exp(-((t - 0.22) / 0.025) ** 2) * 0.45
    return fades((crisp + snap) * 0.65, 0.005, 0.05)


def sfx_quake_rumble(dur, r):
    t = tt(dur)
    nz = r.standard_normal(len(t))
    sub = lp(nz, 110) * 1.45 + bp(nz, 110, 320, 2) * 0.55
    env = np.clip(t / 0.35, 0, 1) * np.exp(-np.maximum(0, t - dur * 0.55) / (dur * 0.45))
    return fades(sub * env * 0.72, 0.04, 0.22)


def sfx_portal_headlights(r):
    # Sweeping golden rift opening + dramatic resonant car-horn/headlight swell!
    dur = 2.4
    t = tt(dur)
    whoosh = bp(r.standard_normal(len(t)), 180, 2800, 2) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2
    swell = (np.sin(TAU * 220 * t) + 0.6 * np.sin(TAU * 330 * t) + 0.35 * np.sin(TAU * 440 * t)) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    glint = modal(dur, [(880.0, 0.55, 1.3), (1318.5, 0.35, 1.0)], r) * 0.30
    return fades(0.50 * whoosh + 0.42 * swell + glint, 0.06, 0.30)


def render_sfx(tl):
    r = rng(901)
    dur = float(tl["duration_s"])
    fps = tl["fps"]
    ev = tl["events"]
    shots = {s["id"]: s for s in tl["shots"]}
    N = ns(dur)
    dry = np.zeros((2, N))
    wet = np.zeros((2, N))
    cues = []

    def add(sig, t_s, label, gain=1.0, p=0.0, rev=0.22):
        if t_s < 0 or t_s >= dur - 0.02:
            return
        st_sig = pan(sig, p) if sig.ndim == 1 else sig
        place(dry, st_sig, t_s, gain)
        if rev > 0:
            place(wet, st_sig, t_s, gain * rev)
        cues.append((t_s, label, gain, p))

    f2t = lambda key: ev[key] / fps
    s_t = lambda sid: shots[sid]["a"] / fps

    # Shot 1: Rainy night street + car tire screech & dramatic impact flash!
    add(sfx_rain(f2t("F_CAR_IMPACT") - s_t(1) + 0.2, r), s_t(1), "night_rain_bed", 0.52, 0.0, 0.15)
    add(sfx_car_screech_crash(r), max(0.0, f2t("F_CAR_IMPACT") - 0.54), "car_screech_and_impact", 1.15, -0.15, 0.34)
    add(sfx_chime_warm(r, 880.0), f2t("F_WAKE_UP"), "unharmed_wakeup_shimmer", 0.45, 0.1, 0.42)

    # Shot 2: Quiet golden dawn breeze + frozen wristwatch tick-tick-STOP!
    add(sfx_dawn_breeze(5.2, r), s_t(2), "golden_dawn_breeze", 0.48, 0.0, 0.22)
    add(sfx_watch_stop(r), f2t("F_WATCH_STOP") - 0.12, "frozen_wristwatch_stop", 0.85, 0.25, 0.18)

    # Shot 3: Vintage plaza horse hooves & kalesa
    add(sfx_kalesa_hooves(5.2, r), s_t(3) + 0.25, "kalesa_horse_hooves", 0.72, -0.25, 0.24)
    add(sfx_dawn_breeze(5.4, r), s_t(3), "plaza_morning_air", 0.38, 0.15, 0.20)

    # Shot 4: Clara ("Okay ka lang?") gentle golden reveal chime
    add(sfx_chime_warm(r, 1046.5), f2t("F_CLARA_APPEAR") - 0.05, "clara_golden_reveal", 0.56, 0.15, 0.45)
    add(sfx_chime_warm(r, 1318.5), f2t("F_OKAY_KA_LANG"), "okay_ka_lang_sparkle", 0.50, -0.1, 0.48)

    # Shot 5: Old town lane footsteps & warm breeze
    add(sfx_dawn_breeze(4.0, r), s_t(5), "old_town_ambience", 0.40, 0.0, 0.22)

    # Shot 6: Giant stopped Clock Tower heavy bronze gear clunk & hollow resonance!
    add(sfx_clock_clunk(r), f2t("F_CLOCK_FROZEN") - 0.05, "clock_tower_frozen_clunk", 0.92, 0.0, 0.46)

    # Shot 7: Golden hillside petals breeze
    add(sfx_dawn_breeze(4.1, r), s_t(7), "hillside_petal_breeze", 0.52, -0.15, 0.26)
    add(sfx_chime_warm(r, 1174.7), f2t("F_DAYS_PASS"), "time_passing_shimmer", 0.42, 0.20, 0.42)

    # Shot 8 & 9: Sparkling river water & firefly twilight warmth
    add(sfx_river_bed(6.0, r), s_t(8), "river_sunset_flow", 0.56, -0.15, 0.26)
    add(sfx_chime_warm(r, 1046.5), f2t("F_FALL_IN_LOVE"), "firefly_love_shimmer", 0.48, 0.15, 0.48)
    add(sfx_dawn_breeze(4.8, r), s_t(9), "twilight_acacia_breeze", 0.42, 0.10, 0.28)

    # Shot 10: Distant hospital siren + ECG heart-monitor beeps + Clara fading like smoke!
    add(sfx_distant_siren(3.2, r), f2t("F_SKY_SIREN") - 0.35, "distant_sky_siren", 0.78, -0.25, 0.52)
    add(sfx_ecg_beeps(3.6, r), f2t("F_HEART_MACHINE") - 0.10, "hospital_ecg_pulse", 0.82, 0.25, 0.48)
    add(sfx_smoke_fade(r), f2t("F_HAND_GLOW") - 0.08, "clara_hand_glow_fade", 0.92, 0.10, 0.48)
    add(sfx_smoke_fade(r), f2t("F_FADE_SMOKE") - 0.05, "clara_smoke_dissolve", 0.80, -0.15, 0.52)

    # Shot 11 & 12: Library vintage page rustle + dramatic 1970s photo flip reveal!
    add(sfx_page_flip(r), f2t("F_OLD_PHOTO") - 0.10, "library_album_page", 0.74, -0.12, 0.26)
    add(sfx_page_flip(r), f2t("F_PHOTO_BACK") - 0.14, "photo_card_flip_crest", 0.90, 0.0, 0.30)
    add(sfx_chime_warm(r, 659.3), f2t("F_PHOTO_BACK") + 0.02, "surname_crest_sting", 0.72, 0.0, 0.48)

    # Shot 13: PART 1 CLIFFHANGER — Road earthquake rumble + tearing blinding headlight rift!
    add(sfx_quake_rumble(3.6, r), f2t("F_ROAD_QUAKE") - 0.05, "cobble_road_quake", 1.10, 0.0, 0.36)
    add(sfx_portal_headlights(r), f2t("F_LIGHT_OPEN") - 0.08, "blinding_headlight_portal", 1.05, 0.0, 0.46)
    add(sfx_chime_warm(r, 880.0), f2t("F_PART_TWO"), "part_two_cliffhanger_chime", 0.64, 0.0, 0.56)

    ir = make_ir(1.05, seed=31, pre=0.014, hf=1.0, density_lp=5200)
    out = dry + convolve_st(wet, ir) * 0.38
    return fades(out, 0.01, 0.12), cues

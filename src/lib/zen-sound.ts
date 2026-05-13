// Synthesizes zen-style chimes using the Web Audio API.
// No network, no dependencies — pure additive synthesis with gentle envelopes.

export type ChimeType = "singing-bowl" | "temple-bell" | "wind-chime" | "soft-gong";

export const CHIME_OPTIONS: { value: ChimeType; label: string; description: string }[] = [
  { value: "singing-bowl", label: "Singing Bowl", description: "Bright, sustained harmonics" },
  { value: "temple-bell", label: "Temple Bell", description: "Warm strike with long decay" },
  { value: "wind-chime", label: "Wind Chime", description: "Light, sparkling arpeggio" },
  { value: "soft-gong", label: "Soft Gong", description: "Deep, slow swell" },
];

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Partial {
  freq: number;
  gain: number;
  delay?: number; // seconds, relative to start
}

interface ChimePreset {
  partials: Partial[];
  attack: number;     // seconds to peak
  filterFreq: number; // low-pass cutoff
  basePeakGain: number; // gain at intensity = 1
}

const PRESETS: Record<ChimeType, ChimePreset> = {
  "singing-bowl": {
    // E5 fundamental + fifth + octave + shimmer
    partials: [
      { freq: 659.25, gain: 1.0 },
      { freq: 987.77, gain: 0.45 },
      { freq: 1318.5, gain: 0.25 },
      { freq: 1975.5, gain: 0.1 },
    ],
    attack: 0.05,
    filterFreq: 2400,
    basePeakGain: 0.35,
  },
  "temple-bell": {
    // Lower fundamental with inharmonic upper partials for a bell-like timbre
    partials: [
      { freq: 220, gain: 1.0 },     // A3
      { freq: 523.25, gain: 0.55 }, // C5 (minor third-ish above octave)
      { freq: 880, gain: 0.35 },    // A5
      { freq: 1396.9, gain: 0.18 }, // F6
    ],
    attack: 0.01,
    filterFreq: 1800,
    basePeakGain: 0.4,
  },
  "wind-chime": {
    // Pentatonic arpeggio of soft bells
    partials: [
      { freq: 1046.5, gain: 0.6, delay: 0.0 },   // C6
      { freq: 1318.5, gain: 0.55, delay: 0.12 }, // E6
      { freq: 1567.98, gain: 0.5, delay: 0.24 }, // G6
      { freq: 2093, gain: 0.4, delay: 0.36 },    // C7
    ],
    attack: 0.02,
    filterFreq: 4000,
    basePeakGain: 0.3,
  },
  "soft-gong": {
    // Very low and slow swell
    partials: [
      { freq: 110, gain: 1.0 },   // A2
      { freq: 164.81, gain: 0.5 },// E3
      { freq: 220, gain: 0.4 },   // A3
      { freq: 329.63, gain: 0.2 },// E4
    ],
    attack: 0.25,
    filterFreq: 900,
    basePeakGain: 0.45,
  },
};

export function playZenChime(
  durationSeconds = 2,
  type: ChimeType = "singing-bowl",
  intensity = 1,
) {
  const audio = getContext();
  if (!audio) return;

  const preset = PRESETS[type] ?? PRESETS["singing-bowl"];
  const now = audio.currentTime;
  const duration = Math.max(0.5, durationSeconds);
  const peakGain = Math.max(0.0001, preset.basePeakGain * Math.max(0, Math.min(1, intensity)));

  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(peakGain, now + preset.attack);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = preset.filterFreq;
  filter.Q.value = 0.5;

  master.connect(filter).connect(audio.destination);

  preset.partials.forEach(({ freq, gain, delay = 0 }) => {
    const start = now + delay;
    if (start >= now + duration) return;

    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const g = audio.createGain();
    // Per-partial envelope so delayed notes (wind chime) fade in too
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.04, preset.attack));
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(now + duration + 0.1);
  });
}

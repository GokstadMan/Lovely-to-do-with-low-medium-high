// Synthesizes a soft singing-bowl style chime using the Web Audio API.
// No network, no dependencies — gentle harmonic sines with a slow decay.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playZenChime(durationSeconds = 2) {
  const audio = getContext();
  if (!audio) return;

  const now = audio.currentTime;
  const duration = durationSeconds;

  // Master gain with gentle fade in / long decay
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Soft low-pass to take any harshness off
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.5;

  master.connect(filter).connect(audio.destination);

  // Pentatonic-friendly harmonics (E5 fundamental + perfect fifth + octave)
  const partials = [
    { freq: 659.25, gain: 1.0 },   // E5 fundamental
    { freq: 987.77, gain: 0.45 },  // B5 (fifth)
    { freq: 1318.5, gain: 0.25 },  // E6 (octave)
    { freq: 1975.5, gain: 0.1 },   // B6 shimmer
  ];

  partials.forEach(({ freq, gain }) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const g = audio.createGain();
    g.gain.value = gain;

    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}

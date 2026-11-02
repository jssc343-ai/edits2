export type SfxCategory = "animal" | "nature" | "vehicle" | "impact" | "clap" | "metal" | "drum" | "fun";

export interface SfxItem {
  id: string;
  kind: string;
  at: number;
  name: string;
  /** Length of the window (seconds) in which the sound keeps repeating. 0 = play once. */
  span?: number;
  /** Silence (seconds) between one repeat and the next. */
  pause?: number;
  /** Per-item volume, 0..1. */
  vol?: number;
  /** Slightly vary timing and loudness of each repeat so it sounds natural. */
  random?: boolean;
}

const MAX_REPEATS = 200;

const jitter = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export function sfxOccurrences(it: SfxItem, natural: number): { at: number; vol: number }[] {
  const span = Math.max(0, it.span ?? 0);
  const step = natural + Math.max(0, it.pause ?? 0);
  const count = span > 0 ? Math.min(MAX_REPEATS, Math.floor(span / step) + 1) : 1;
  const base = it.vol ?? 1;
  const seedBase = it.id.length * 7 + it.kind.length * 3;
  return Array.from({ length: count }, (_, i) => {
    if (!it.random || i === 0) return { at: it.at + i * step, vol: base };
    const r1 = jitter(seedBase + i);
    const r2 = jitter(seedBase + i * 31);
    const wiggle = (r1 - 0.5) * 2 * Math.min(0.2, step * 0.3);
    return { at: Math.max(0, it.at + i * step + wiggle), vol: base * (0.7 + 0.3 * r2) };
  });
}

interface OscLayer {
  k: "o";
  w: OscillatorType;
  f0: number;
  f1: number;
  d: number;
  v: number;
  at: number;
  vib?: [number, number];
  hold: number;
}

interface NoiseLayer {
  k: "n";
  ft: BiquadFilterType;
  f0: number;
  f1: number;
  q: number;
  d: number;
  v: number;
  at: number;
  atk: number;
}

type Layer = OscLayer | NoiseLayer;

export interface Sfx {
  id: string;
  zh: string;
  en: string;
  cat: SfxCategory;
  layers: Layer[];
}

export const SFX_CATEGORIES: { id: SfxCategory; zh: string; en: string }[] = [
  { id: "animal", zh: "動物", en: "Animals" },
  { id: "nature", zh: "自然", en: "Nature" },
  { id: "vehicle", zh: "車輛", en: "Vehicles" },
  { id: "impact", zh: "物擊", en: "Impacts" },
  { id: "clap", zh: "拍手", en: "Claps" },
  { id: "metal", zh: "金屬", en: "Metal" },
  { id: "drum", zh: "擊鼓", en: "Drums" },
  { id: "fun", zh: "趣味", en: "Fun" },
];

const o = (p: Partial<OscLayer> & Pick<OscLayer, "w" | "f0" | "f1" | "d" | "v">): OscLayer => ({
  k: "o",
  at: 0,
  hold: 0,
  ...p,
});

const n = (p: Partial<NoiseLayer> & Pick<NoiseLayer, "ft" | "f0" | "f1" | "q" | "d" | "v">): NoiseLayer => ({
  k: "n",
  at: 0,
  atk: 0.005,
  ...p,
});

const metal = (base: number, ratios: number[], d: number, v: number, at = 0): Layer[] =>
  ratios.map((r, i) => o({ w: "sine", f0: base * r, f1: base * r, d: d / (1 + i * 0.35), v: v / (1 + i * 0.5), at }));

const clap = (at: number, v = 0.6): Layer[] =>
  [0, 0.012, 0.026].map((dt) => n({ ft: "bandpass", f0: 1500, f1: 1300, q: 1.2, d: 0.08, v, at: at + dt, atk: 0.001 }));

const snare = (at: number, v = 0.6): Layer[] => [
  n({ ft: "bandpass", f0: 1800, f1: 1800, q: 0.8, d: 0.2, v, at, atk: 0.001 }),
  o({ w: "triangle", f0: 220, f1: 160, d: 0.12, v: v * 0.7, at }),
];

const times = (count: number, step: number, make: (at: number, i: number) => Layer[]): Layer[] =>
  Array.from({ length: count }, (_, i) => make(i * step, i)).flat();

const mk = (id: string, zh: string, en: string, cat: SfxCategory, layers: Layer[]): Sfx => ({ id, zh, en, cat, layers });

export const SFX_LIST: Sfx[] = [
  mk("cat", "貓叫", "Cat meow", "animal", [
    o({ w: "triangle", f0: 500, f1: 900, d: 0.15, v: 0.3 }),
    o({ w: "triangle", f0: 900, f1: 450, d: 0.4, v: 0.3, at: 0.15 }),
  ]),
  mk("dog", "狗吠", "Dog bark", "animal", [
    ...[0, 0.24].flatMap((at) => [
      o({ w: "sawtooth", f0: 260, f1: 140, d: 0.13, v: 0.35, at }),
      n({ ft: "bandpass", f0: 900, f1: 500, q: 2, d: 0.12, v: 0.25, at }),
    ]),
  ]),
  mk("bird", "鳥鳴", "Bird chirp", "animal", [
    ...[0, 0.1, 0.2, 0.45, 0.55].map((at, i) => o({ w: "sine", f0: 2400 + i * 100, f1: 3400, d: 0.08, v: 0.25, at })),
  ]),
  mk("rooster", "公雞啼", "Rooster", "animal", [
    o({ w: "square", f0: 500, f1: 900, d: 0.25, v: 0.15 }),
    o({ w: "square", f0: 900, f1: 700, d: 0.15, v: 0.15, at: 0.25 }),
    o({ w: "square", f0: 700, f1: 400, d: 0.5, v: 0.15, at: 0.45 }),
  ]),
  mk("cow", "牛叫", "Cow moo", "animal", [o({ w: "sawtooth", f0: 110, f1: 90, d: 1.1, v: 0.25, vib: [5, 8], hold: 0.6 })]),
  mk("frog", "青蛙", "Frog", "animal", [
    ...[0, 0.11, 0.22, 0.5, 0.61].map((at) => o({ w: "sawtooth", f0: 200, f1: 110, d: 0.09, v: 0.2, at })),
  ]),
  mk("duck", "鴨叫", "Duck quack", "animal", [
    ...[0, 0.22].flatMap((at) => [
      o({ w: "sawtooth", f0: 450, f1: 300, d: 0.14, v: 0.25, at }),
      n({ ft: "bandpass", f0: 1200, f1: 1200, q: 3, d: 0.14, v: 0.2, at }),
    ]),
  ]),
  mk("cricket", "蟋蟀", "Crickets", "animal", times(10, 0.06, (at) => [o({ w: "sine", f0: 4200, f1: 4200, d: 0.03, v: 0.2, at })])),
  mk("owl", "貓頭鷹", "Owl", "animal", [
    o({ w: "sine", f0: 420, f1: 380, d: 0.35, v: 0.35, hold: 0.5 }),
    o({ w: "sine", f0: 400, f1: 300, d: 0.6, v: 0.35, at: 0.5, hold: 0.4 }),
  ]),
  mk("roar", "獅吼", "Lion roar", "animal", [
    o({ w: "sawtooth", f0: 90, f1: 60, d: 1.3, v: 0.3, vib: [25, 20], hold: 0.5 }),
    n({ ft: "lowpass", f0: 600, f1: 300, q: 1, d: 1.3, v: 0.35, atk: 0.1 }),
  ]),

  mk("wind", "風聲", "Wind", "nature", [n({ ft: "bandpass", f0: 300, f1: 900, q: 1.5, d: 2, v: 0.5, atk: 0.8 })]),
  mk("rain", "雨聲", "Rain", "nature", [
    n({ ft: "highpass", f0: 3000, f1: 3000, q: 0.7, d: 2, v: 0.3, atk: 0.2 }),
    n({ ft: "bandpass", f0: 6000, f1: 6000, q: 1, d: 2, v: 0.2, atk: 0.2 }),
  ]),
  mk("wave", "海浪", "Ocean wave", "nature", [n({ ft: "lowpass", f0: 400, f1: 1500, q: 0.8, d: 2, v: 0.6, atk: 0.9 })]),
  mk("thunder", "雷聲", "Thunder", "nature", [
    n({ ft: "lowpass", f0: 200, f1: 60, q: 1, d: 2, v: 0.8, atk: 0.05 }),
    o({ w: "sine", f0: 60, f1: 30, d: 1.6, v: 0.4 }),
  ]),
  mk("fire", "火焰", "Fire crackle", "nature", [
    ...[0, 0.07, 0.18, 0.25, 0.4, 0.47, 0.62, 0.8, 0.9, 1.05].map((at) =>
      n({ ft: "highpass", f0: 2500, f1: 2500, q: 1, d: 0.03, v: 0.5, at, atk: 0.001 }),
    ),
    n({ ft: "lowpass", f0: 300, f1: 300, q: 0.7, d: 1.3, v: 0.2, atk: 0.2 }),
  ]),
  mk("stream", "溪流", "Stream", "nature", [
    n({ ft: "bandpass", f0: 1500, f1: 2200, q: 3, d: 1.8, v: 0.4, atk: 0.3 }),
    n({ ft: "bandpass", f0: 2500, f1: 1800, q: 4, d: 1.8, v: 0.25, atk: 0.3 }),
  ]),
  mk("splash", "水花", "Splash", "nature", [
    n({ ft: "bandpass", f0: 1200, f1: 3000, q: 1, d: 0.5, v: 0.5, atk: 0.01 }),
    n({ ft: "highpass", f0: 4000, f1: 4000, q: 0.7, d: 0.4, v: 0.3, at: 0.05, atk: 0.01 }),
  ]),
  mk("leaves", "樹葉沙沙", "Rustling leaves", "nature", [n({ ft: "highpass", f0: 5000, f1: 5000, q: 0.8, d: 1.4, v: 0.3, atk: 0.4 })]),

  mk("horn", "汽車喇叭", "Car horn", "vehicle", [
    o({ w: "square", f0: 440, f1: 440, d: 0.7, v: 0.15, hold: 0.8 }),
    o({ w: "square", f0: 554, f1: 554, d: 0.7, v: 0.15, hold: 0.8 }),
  ]),
  mk("engine", "引擎", "Engine", "vehicle", [
    o({ w: "sawtooth", f0: 60, f1: 110, d: 1.5, v: 0.25, vib: [18, 8], hold: 0.7 }),
    n({ ft: "lowpass", f0: 250, f1: 400, q: 1, d: 1.5, v: 0.3, atk: 0.2 }),
  ]),
  mk("siren", "警笛", "Siren", "vehicle", [
    o({ w: "sine", f0: 600, f1: 1000, d: 0.6, v: 0.3, hold: 0.9 }),
    o({ w: "sine", f0: 1000, f1: 600, d: 0.6, v: 0.3, at: 0.6, hold: 0.9 }),
    o({ w: "sine", f0: 600, f1: 1000, d: 0.6, v: 0.3, at: 1.2, hold: 0.9 }),
  ]),
  mk("train", "火車汽笛", "Train whistle", "vehicle", [
    o({ w: "square", f0: 392, f1: 392, d: 1.2, v: 0.12, hold: 0.8 }),
    o({ w: "square", f0: 494, f1: 494, d: 1.2, v: 0.12, hold: 0.8 }),
  ]),
  mk("plane", "飛機掠過", "Plane fly-by", "vehicle", [
    n({ ft: "bandpass", f0: 300, f1: 1800, q: 2, d: 2, v: 0.5, atk: 0.9 }),
    o({ w: "sawtooth", f0: 120, f1: 200, d: 2, v: 0.12, hold: 0.5 }),
  ]),
  mk("bicycle", "腳踏車鈴", "Bicycle bell", "vehicle", [...metal(2600, [1, 2.76], 0.8, 0.3), ...metal(2600, [1, 2.76], 0.8, 0.3, 0.22)]),
  mk("brake", "煞車", "Screeching brake", "vehicle", [
    n({ ft: "highpass", f0: 3000, f1: 1800, q: 6, d: 0.9, v: 0.35, atk: 0.05 }),
    o({ w: "square", f0: 1800, f1: 1200, d: 0.9, v: 0.06, hold: 0.5 }),
  ]),

  mk("punch", "拳擊", "Punch", "impact", [
    o({ w: "sine", f0: 150, f1: 50, d: 0.15, v: 0.6 }),
    n({ ft: "lowpass", f0: 800, f1: 400, q: 1, d: 0.1, v: 0.4, atk: 0.001 }),
  ]),
  mk("knock", "敲門", "Door knock", "impact", times(3, 0.18, (at) => [
    o({ w: "sine", f0: 180, f1: 120, d: 0.09, v: 0.6, at }),
    n({ ft: "lowpass", f0: 1000, f1: 600, q: 1, d: 0.05, v: 0.4, at, atk: 0.001 }),
  ])),
  mk("crash", "撞擊", "Crash", "impact", [
    n({ ft: "bandpass", f0: 1500, f1: 500, q: 0.7, d: 0.6, v: 0.6, atk: 0.002 }),
    n({ ft: "highpass", f0: 3000, f1: 3000, q: 0.7, d: 0.9, v: 0.3, atk: 0.002 }),
    o({ w: "sine", f0: 100, f1: 40, d: 0.4, v: 0.4 }),
  ]),
  mk("glass", "玻璃碎裂", "Glass break", "impact", [
    n({ ft: "highpass", f0: 5000, f1: 5000, q: 0.7, d: 0.4, v: 0.4, atk: 0.001 }),
    ...[0, 0.08, 0.15].map((at, i) => o({ w: "sine", f0: 4500 + i * 700, f1: 4500 + i * 700, d: 0.4, v: 0.15, at })),
  ]),
  mk("boom", "爆炸", "Explosion", "impact", [
    n({ ft: "lowpass", f0: 1200, f1: 80, q: 1, d: 1.6, v: 0.9, atk: 0.002 }),
    o({ w: "sine", f0: 80, f1: 25, d: 1.2, v: 0.6 }),
  ]),
  mk("thud", "重物落地", "Heavy thud", "impact", [
    o({ w: "sine", f0: 90, f1: 40, d: 0.3, v: 0.8 }),
    n({ ft: "lowpass", f0: 300, f1: 100, q: 1, d: 0.25, v: 0.4, atk: 0.001 }),
  ]),
  mk("slap", "啪", "Slap", "impact", [
    n({ ft: "bandpass", f0: 2500, f1: 1500, q: 1.5, d: 0.1, v: 0.7, atk: 0.001 }),
    o({ w: "triangle", f0: 400, f1: 200, d: 0.08, v: 0.3 }),
  ]),

  mk("clap1", "單拍手", "Single clap", "clap", clap(0)),
  mk("clap2", "雙拍手", "Double clap", "clap", [...clap(0), ...clap(0.25)]),
  mk("applause", "掌聲", "Applause", "clap", times(32, 0.05, (at, i) => clap(at + ((i * 7) % 5) * 0.01, 0.22))),
  mk("snap", "響指", "Finger snap", "clap", [
    o({ w: "sine", f0: 2000, f1: 1200, d: 0.04, v: 0.5 }),
    n({ ft: "highpass", f0: 3000, f1: 3000, q: 1, d: 0.05, v: 0.5, atk: 0.001 }),
  ]),

  mk("bell", "鐘聲", "Bell", "metal", metal(660, [1, 2, 2.76, 5.4], 1.8, 0.5)),
  mk("gong", "銅鑼", "Gong", "metal", metal(120, [1, 1.5, 2.2, 3.1, 4.3], 2.5, 0.6)),
  mk("triangle", "三角鐵", "Triangle", "metal", metal(2400, [1, 2.7, 4.1], 1.5, 0.35)),
  mk("anvil", "鐵砧", "Anvil", "metal", [
    ...metal(900, [1, 2.3, 3.7, 5.1], 0.5, 0.5),
    n({ ft: "bandpass", f0: 3000, f1: 3000, q: 2, d: 0.08, v: 0.4, atk: 0.001 }),
  ]),
  mk("coin", "金幣", "Coin", "metal", [
    o({ w: "sine", f0: 1568, f1: 1568, d: 0.08, v: 0.3 }),
    ...metal(2093, [1, 2.4], 0.6, 0.3, 0.08),
  ]),
  mk("clink", "金屬碰撞", "Metal clink", "metal", [
    ...metal(1800, [1, 2.4, 4.2], 0.35, 0.4),
    n({ ft: "highpass", f0: 5000, f1: 5000, q: 1, d: 0.05, v: 0.3, atk: 0.001 }),
  ]),

  mk("kick", "大鼓", "Bass drum", "drum", [o({ w: "sine", f0: 150, f1: 45, d: 0.3, v: 0.9 })]),
  mk("snare", "小鼓", "Snare drum", "drum", snare(0)),
  mk("tom", "通鼓", "Tom drum", "drum", [o({ w: "sine", f0: 220, f1: 110, d: 0.45, v: 0.8 })]),
  mk("cymbal", "鈸", "Cymbal", "drum", [
    n({ ft: "highpass", f0: 6000, f1: 6000, q: 0.6, d: 1.6, v: 0.4, atk: 0.002 }),
    n({ ft: "bandpass", f0: 9000, f1: 9000, q: 1, d: 1.2, v: 0.25, atk: 0.002 }),
  ]),
  mk("roll", "鼓點", "Drum roll", "drum", times(12, 0.08, (at, i) => snare(at, 0.25 + i * 0.03))),

  mk("whoosh", "嗖", "Whoosh", "fun", [n({ ft: "bandpass", f0: 300, f1: 3000, q: 1.2, d: 0.8, v: 0.5, atk: 0.3 })]),
  mk("ding", "叮咚", "Ding dong", "fun", [...metal(1046, [1, 2], 0.9, 0.4), ...metal(784, [1, 2], 1.1, 0.4, 0.3)]),
  mk("sparkle", "閃亮", "Sparkle", "fun", times(8, 0.06, (at, i) => [
    o({ w: "sine", f0: 2000 + i * 300, f1: 2000 + i * 300, d: 0.15, v: 0.25, at }),
  ])),
];

export const sfxById = (id: string) => SFX_LIST.find((s) => s.id === id);

export const sfxLength = (s: Sfx) => Math.max(...s.layers.map((l) => l.at + l.d)) + 0.05;

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * 2.2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function schedule(ctx: BaseAudioContext, dest: AudioNode, noise: AudioBuffer, s: Sfx, start: number, vol: number) {
  s.layers.forEach((l) => {
    const t0 = start + l.at;
    const g = ctx.createGain();
    const end = t0 + l.d;
    const atk = l.k === "n" ? Math.min(l.atk, l.d / 2) : 0.005;
    const peak = l.v * vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + atk);
    if (l.k === "o" && l.hold > 0) g.gain.setValueAtTime(peak, t0 + l.d * l.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    if (l.k === "o") {
      const osc = ctx.createOscillator();
      osc.type = l.w;
      osc.frequency.setValueAtTime(l.f0, t0);
      if (l.f1 !== l.f0) osc.frequency.exponentialRampToValueAtTime(l.f1, end);
      if (l.vib) {
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = l.vib[0];
        depth.gain.value = l.vib[1];
        lfo.connect(depth);
        depth.connect(osc.frequency);
        lfo.start(t0);
        lfo.stop(end + 0.02);
      }
      osc.connect(g);
      osc.start(t0);
      osc.stop(end + 0.02);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = l.ft;
      filter.Q.value = l.q;
      filter.frequency.setValueAtTime(l.f0, t0);
      if (l.f1 !== l.f0) filter.frequency.exponentialRampToValueAtTime(l.f1, end);
      src.connect(filter);
      filter.connect(g);
      src.start(t0);
      src.stop(end + 0.02);
    }
    g.connect(dest);
  });
}

let previewCtx: AudioContext | null = null;

export async function previewSfx(id: string) {
  const s = sfxById(id);
  if (!s) return;
  try {
    if (!previewCtx) previewCtx = new AudioContext();
    await previewCtx.resume();
    schedule(previewCtx, previewCtx.destination, noiseBuffer(previewCtx), s, previewCtx.currentTime + 0.02, 0.8);
  } catch {
    /* audio unavailable */
  }
}

const SAMPLE_RATE = 22050;

function toWav(buffer: AudioBuffer): Blob {
  const data = buffer.getChannelData(0);
  const count = data.length;
  const ab = new ArrayBuffer(44 + count * 2);
  const v = new DataView(ab);
  const text = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i));
  };
  text(0, "RIFF");
  v.setUint32(4, 36 + count * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, SAMPLE_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
  return new Blob([ab], { type: "audio/wav" });
}

export async function renderSfxTrack(items: SfxItem[]): Promise<string | null> {
  const entries = items.flatMap((it) => {
    const s = sfxById(it.kind);
    return s ? sfxOccurrences(it, sfxLength(s)).map((o) => ({ s, at: o.at, vol: o.vol })) : [];
  });
  if (!entries.length) return null;
  const total = Math.max(...entries.map((e) => e.at + sfxLength(e.s))) + 0.2;
  const ctx = new OfflineAudioContext(1, Math.ceil(SAMPLE_RATE * total), SAMPLE_RATE);
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  const noise = noiseBuffer(ctx);
  entries.forEach((e) => schedule(ctx, master, noise, e.s, e.at, e.vol));
  const rendered = await ctx.startRendering();
  return URL.createObjectURL(toWav(rendered));
}

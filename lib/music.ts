type ScaleKey = "major" | "minor" | "pent" | "dorian" | "lydian";
type Style = "calm" | "pulse" | "bright";

export interface Track {
  id: string;
  zh: string;
  en: string;
  bpm: number;
  root: number;
  scale: ScaleKey;
  wave: OscillatorType;
  prog: number;
  style: Style;
}

const SCALES: Record<ScaleKey, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pent: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

const PROGS = [
  [0, 4, 5, 3],
  [0, 5, 3, 4],
  [0, 3, 4, 4],
  [0, 2, 5, 4],
];

const RAW: [string, string, number, number, ScaleKey, OscillatorType, number, Style][] = [
  ["晨光序曲", "Morning Light", 84, 60, "major", "triangle", 0, "calm"],
  ["回憶相簿", "Photo Album", 76, 57, "major", "sine", 1, "calm"],
  ["午後微風", "Afternoon Breeze", 92, 62, "pent", "triangle", 2, "calm"],
  ["星空漫步", "Starlit Walk", 70, 57, "lydian", "sine", 3, "calm"],
  ["海岸日落", "Coastal Sunset", 88, 59, "major", "triangle", 1, "calm"],
  ["溫柔時光", "Gentle Hours", 72, 55, "major", "sine", 0, "calm"],
  ["雨後清新", "After the Rain", 80, 64, "pent", "sine", 3, "calm"],
  ["老街散步", "Old Town Stroll", 96, 60, "dorian", "triangle", 2, "calm"],
  ["夢境漂浮", "Dreamy Drift", 66, 58, "lydian", "sine", 1, "calm"],
  ["童年記憶", "Childhood Echo", 100, 65, "major", "triangle", 0, "bright"],
  ["城市夜色", "City Nights", 104, 57, "minor", "sawtooth", 2, "pulse"],
  ["旅途出發", "Set Off", 116, 62, "major", "square", 0, "bright"],
  ["家人團聚", "Family Gathering", 90, 60, "major", "triangle", 1, "bright"],
  ["櫻花飛舞", "Cherry Blossoms", 78, 62, "pent", "sine", 0, "calm"],
  ["山林呼吸", "Forest Breath", 68, 55, "dorian", "sine", 3, "calm"],
  ["慶典派對", "Celebration", 124, 64, "major", "square", 1, "pulse"],
  ["活力運動", "Active Beat", 128, 57, "minor", "sawtooth", 2, "pulse"],
  ["閃耀舞台", "Shining Stage", 118, 60, "lydian", "square", 0, "pulse"],
  ["電影開場", "Film Opening", 74, 52, "minor", "sawtooth", 3, "calm"],
  ["復古唱片", "Vintage Vinyl", 94, 58, "dorian", "triangle", 1, "bright"],
  ["熱帶假期", "Tropical Holiday", 108, 65, "pent", "triangle", 0, "bright"],
  ["冬日暖陽", "Winter Sun", 82, 59, "major", "sine", 2, "calm"],
  ["懷舊時光", "Nostalgia", 72, 53, "minor", "triangle", 1, "calm"],
  ["浪漫晚餐", "Romantic Dinner", 76, 56, "minor", "sine", 0, "calm"],
  ["輕快早餐", "Cheerful Brunch", 112, 64, "major", "triangle", 2, "bright"],
  ["未來脈動", "Future Pulse", 120, 55, "dorian", "sawtooth", 3, "pulse"],
  ["神秘探險", "Mystery Quest", 98, 52, "minor", "square", 3, "pulse"],
  ["感恩時刻", "Gratitude", 70, 60, "major", "sine", 3, "calm"],
  ["畢業典禮", "Graduation Day", 86, 62, "major", "triangle", 0, "bright"],
  ["永恆回憶", "Forever Memories", 64, 57, "lydian", "sine", 2, "calm"],
  ["海風輕拂", "Sea Breeze", 86, 60, "pent", "triangle", 0, "calm"],
  ["彩虹糖果", "Rainbow Candy", 118, 64, "major", "square", 1, "bright"],
  ["月光小夜曲", "Moonlight Serenade", 68, 56, "minor", "sine", 1, "calm"],
  ["春日野餐", "Spring Picnic", 98, 62, "major", "triangle", 2, "bright"],
  ["晨跑節奏", "Morning Run", 126, 59, "dorian", "sawtooth", 0, "pulse"],
  ["雪夜暖爐", "Fireside Snow", 66, 53, "major", "sine", 3, "calm"],
  ["夏日海灘", "Summer Beach", 110, 64, "pent", "triangle", 1, "bright"],
  ["咖啡館午後", "Cafe Afternoon", 90, 58, "dorian", "triangle", 3, "calm"],
  ["追光少年", "Chasing Light", 122, 60, "lydian", "square", 2, "pulse"],
  ["童話森林", "Fairytale Forest", 74, 62, "lydian", "sine", 0, "calm"],
  ["霓虹街頭", "Neon Streets", 114, 55, "minor", "sawtooth", 1, "pulse"],
  ["婚禮誓言", "Wedding Vows", 72, 60, "major", "sine", 2, "calm"],
  ["生日快樂", "Happy Birthday", 120, 65, "major", "square", 0, "bright"],
  ["山頂日出", "Summit Sunrise", 84, 57, "major", "triangle", 3, "bright"],
  ["秋葉紛飛", "Falling Leaves", 78, 55, "minor", "triangle", 0, "calm"],
  ["太空漫遊", "Space Voyage", 88, 50, "dorian", "sine", 3, "calm"],
  ["街角爵士", "Corner Jazz", 102, 58, "dorian", "triangle", 2, "bright"],
  ["勇氣之旅", "Journey of Courage", 108, 57, "minor", "sawtooth", 3, "pulse"],
  ["幸福時刻", "Moment of Joy", 96, 63, "major", "triangle", 1, "bright"],
  ["時光膠囊", "Time Capsule", 70, 59, "pent", "sine", 2, "calm"],
];

export const BUILT_IN_TRACKS: Track[] = RAW.map(([zh, en, bpm, root, scale, wave, prog, style], i) => ({
  id: `track-${i + 1}`,
  zh,
  en,
  bpm,
  root,
  scale,
  wave,
  prog,
  style,
}));

const SAMPLE_RATE = 22050;
const BARS = 8;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toWav(buffer: AudioBuffer): Blob {
  const data = buffer.getChannelData(0);
  const n = data.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const v = new DataView(ab);
  const text = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  text(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
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
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    v.setInt16(44 + i * 2, s * 0x7fff, true);
  }
  return new Blob([ab], { type: "audio/wav" });
}

export async function renderTrack(track: Track): Promise<string> {
  const beat = 60 / track.bpm;
  const duration = BARS * 4 * beat;
  const ctx = new OfflineAudioContext(1, Math.ceil(SAMPLE_RATE * duration), SAMPLE_RATE);
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  const scale = SCALES[track.scale];
  const midi = (degree: number) =>
    track.root + 12 * Math.floor(degree / scale.length) + scale[((degree % scale.length) + scale.length) % scale.length];
  const rand = mulberry32(track.bpm * 31 + track.root * 7 + track.prog);

  const tone = (note: number, start: number, len: number, type: OscillatorType, vol: number) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz(note);
    const g = ctx.createGain();
    const attack = Math.min(0.03, len / 4);
    const release = Math.min(0.25, len / 2);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + attack);
    g.gain.setValueAtTime(vol, Math.max(start + attack, start + len - release));
    g.gain.linearRampToValueAtTime(0, start + len);
    o.connect(g);
    g.connect(master);
    o.start(start);
    o.stop(start + len + 0.01);
  };

  const kick = (start: number) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(130, start);
    o.frequency.exponentialRampToValueAtTime(42, start + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    o.connect(g);
    g.connect(master);
    o.start(start);
    o.stop(start + 0.22);
  };

  const pool = [0, 2, 4, 5, 7, 9];
  for (let bar = 0; bar < BARS; bar++) {
    const chord = PROGS[track.prog][bar % 4];
    const t0 = bar * 4 * beat;
    const padWave: OscillatorType = track.wave === "sine" ? "sine" : "triangle";
    [0, 2, 4].forEach((o) => tone(midi(chord + o) - 12, t0, 4 * beat, padWave, 0.05));

    if (track.style === "calm") {
      tone(midi(chord) - 24, t0, 2 * beat, "sine", 0.16);
      tone(midi(chord) - 24, t0 + 2 * beat, 2 * beat, "sine", 0.12);
    } else {
      for (let b = 0; b < 4; b++) {
        const start = t0 + b * beat + (track.style === "bright" ? beat / 2 : 0);
        tone(midi(chord) - 24, start, beat * 0.45, "sine", 0.16);
        if (track.style === "pulse" || b % 2 === 0) kick(t0 + b * beat);
      }
    }

    const step = track.style === "calm" ? beat : beat / 2;
    const steps = Math.round((4 * beat) / step);
    let degree = chord + 4;
    for (let s = 0; s < steps; s++) {
      if (rand() < (track.style === "calm" ? 0.25 : 0.12)) continue;
      degree = chord + pool[Math.floor(rand() * pool.length)] + (track.style === "bright" ? 7 : 0);
      tone(midi(degree), t0 + s * step, step * 0.9, track.wave, track.wave === "sine" ? 0.12 : 0.06);
    }
  }

  const rendered = await ctx.startRendering();
  return URL.createObjectURL(toWav(rendered));
}

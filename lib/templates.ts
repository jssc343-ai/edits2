export interface Camera {
  cx: number;
  cy: number;
  zoom: number;
  rot: number;
}

export type ParticleKind = "dust" | "snow" | "sparkle" | null;

export interface MotionTemplate {
  id: string;
  en: string;
  zh: string;
  descZh: string;
  descEn: string;
  depth: number;
  camera: (t: number) => Camera;
  particles: ParticleKind;
  sweep?: boolean;
  glitch?: boolean;
}

export const MOTION_PERIOD = 6;
const TAU = Math.PI * 2;
const ph = (t: number) => (t / MOTION_PERIOD) * TAU;

export const MOTION_TEMPLATES: MotionTemplate[] = [
  {
    id: "orbit",
    en: "Parallax orbit",
    zh: "立體環繞",
    descZh: "鏡頭繞著畫面緩緩環繞，近景與遠景產生真實視差。",
    descEn: "The camera glides around the scene with true near/far parallax.",
    depth: 1.1,
    camera: (t) => ({ cx: Math.sin(ph(t)), cy: Math.cos(ph(t)) * 0.5, zoom: 0.25, rot: 0 }),
    particles: "dust",
  },
  {
    id: "dolly",
    en: "Dolly push",
    zh: "電影推進",
    descZh: "鏡頭緩慢推進，近景放大更快，帶出空間縱深。",
    descEn: "A slow push-in where foreground grows faster than background.",
    depth: 0.9,
    camera: (t) => ({ cx: Math.sin(ph(t)) * 0.25, cy: 0, zoom: 0.5 - 0.5 * Math.cos(ph(t)), rot: 0 }),
    particles: null,
    sweep: true,
  },
  {
    id: "float",
    en: "Floating dust",
    zh: "漂浮微塵",
    descZh: "輕盈漂浮的視角，空氣中飄著細微光塵。",
    descEn: "A gentle floating view with drifting light dust in the air.",
    depth: 0.8,
    camera: (t) => ({ cx: Math.sin(ph(t)) * 0.6, cy: Math.sin(ph(t) * 2) * 0.4, zoom: 0.2, rot: 0 }),
    particles: "dust",
  },
  {
    id: "pendulum",
    en: "Memory swing",
    zh: "回憶擺盪",
    descZh: "像懷錶一般左右擺盪，帶有細微旋轉。",
    descEn: "A pendulum-like swing with a subtle roll.",
    depth: 1.2,
    camera: (t) => ({ cx: Math.sin(ph(t)) * 1.2, cy: 0, zoom: 0.2, rot: Math.sin(ph(t)) * 0.035 }),
    particles: null,
  },
  {
    id: "pan",
    en: "Cinematic pan",
    zh: "電影橫移",
    descZh: "寬幅橫向移動，加上流動的光束掃過畫面。",
    descEn: "A wide lateral move with a light beam sweeping across.",
    depth: 1.3,
    camera: (t) => ({ cx: Math.sin(ph(t) * 0.5) * 1.3, cy: 0.1, zoom: 0.35, rot: 0 }),
    particles: null,
    sweep: true,
  },
  {
    id: "snow",
    en: "Falling snow",
    zh: "飄雪",
    descZh: "細雪緩緩飄落，鏡頭輕輕搖動。",
    descEn: "Snow drifts down while the camera sways softly.",
    depth: 0.8,
    camera: (t) => ({ cx: Math.sin(ph(t)) * 0.4, cy: Math.sin(ph(t)) * 0.2, zoom: 0.15, rot: 0 }),
    particles: "snow",
  },
  {
    id: "sparkle",
    en: "Sparkle glow",
    zh: "星光閃耀",
    descZh: "星芒閃爍並有光暈掃過，適合紀念照。",
    descEn: "Twinkling stars and a glow sweep, great for keepsakes.",
    depth: 0.9,
    camera: (t) => ({ cx: Math.cos(ph(t)) * 0.6, cy: Math.sin(ph(t)) * 0.3, zoom: 0.3, rot: 0 }),
    particles: "sparkle",
    sweep: true,
  },
  {
    id: "heartbeat",
    en: "Heartbeat",
    zh: "心跳脈動",
    descZh: "畫面如心跳般脈動，近景特別有力。",
    descEn: "The scene pulses like a heartbeat, foreground hits hardest.",
    depth: 0.6,
    camera: (t) => ({ cx: 0, cy: 0, zoom: Math.pow(Math.max(0, Math.sin(ph(t) * 2)), 6), rot: 0 }),
    particles: null,
  },
  {
    id: "glitch",
    en: "Hologram glitch",
    zh: "全像故障",
    descZh: "間歇的數位故障與色偏，充滿科技感。",
    descEn: "Intermittent digital glitch and colour split, very sci-fi.",
    depth: 0.7,
    camera: (t) => ({ cx: Math.sin(ph(t)) * 0.3, cy: 0, zoom: 0.2, rot: 0 }),
    particles: null,
    glitch: true,
  },
];

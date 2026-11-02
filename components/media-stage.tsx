"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  activeClipIndex,
  aspectSize,
  buildTimeline,
  clipLen,
  renderAt,
  routeAudio,
  type Asset,
  type Project,
  type Stroke,
} from "@/lib/compositor";

import { buildGif } from "@/lib/gif";

export interface StageHandle {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (t: number) => void;
  undo: () => void;
  clear: () => void;
  exportMedia: (onProgress: (p: number) => void, signal: AbortSignal) => Promise<{ blob: Blob; ext: string }>;
  exportGif: (onProgress: (p: number) => void, signal: AbortSignal) => Promise<Blob>;
}

interface Props {
  project: Project;
  assets: MutableRefObject<Map<string, Asset>>;
  music: MutableRefObject<HTMLAudioElement | null>;
  sfx?: MutableRefObject<HTMLAudioElement | null>;
  musicVolume: number;
  drawing: boolean;
  color: string;
  size: number;
  onTime: (t: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const options = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export const MediaStage = forwardRef<StageHandle, Props>(function MediaStage(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layersRef = useRef<[HTMLCanvasElement, HTMLCanvasElement] | null>(null);
  const propsRef = useRef(props);
  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const strokesRef = useRef<Map<string, Stroke[]>>(new Map());
  const activeStroke = useRef<Stroke | null>(null);
  const endResolver = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(true);
  const exportingRef = useRef(false);

  useEffect(() => {
    propsRef.current = props;
  });

  const { w, h } = aspectSize(props.project.aspect);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const mk = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    };
    layersRef.current = [mk(), mk()];
    propsRef.current.assets.current.forEach((a) => {
      a.depthKey = "";
    });
  }, [w, h]);

  useEffect(() => {
    const m = props.music.current;
    if (m) m.volume = props.musicVolume;
  }, [props.musicVolume, props.music]);

  const stopMedia = () => {
    props.music.current?.pause();
    props.sfx?.current?.pause();
  };

  const finish = () => {
    playingRef.current = false;
    stopMedia();
    propsRef.current.onPlayingChange(false);
    endResolver.current?.();
    endResolver.current = null;
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let emitted = -1;
    let lastProj: unknown = null;
    let lastT = -1;
    let lastAssets = -1;
    let lastRender = 0;
    let visible = true;
    const watcher =
      typeof IntersectionObserver !== "undefined" && canvasRef.current
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) dirtyRef.current = true;
          })
        : null;
    if (watcher && canvasRef.current) watcher.observe(canvasRef.current);

    const sync = (tl: ReturnType<typeof buildTimeline>) => {
      const p = propsRef.current;
      const playing = playingRef.current;
      p.project.clips.forEach((c, i) => {
        if (c.type !== "video") return;
        const el = p.assets.current.get(c.assetId)?.el;
        if (!(el instanceof HTMLVideoElement)) return;
        const start = tl.starts[i];
        const inside = timeRef.current >= start && timeRef.current < start + clipLen(c);
        el.volume = Math.min(1, Math.max(0, c.volume));
        if (!inside) {
          if (!el.paused) el.pause();
          return;
        }
        const want = c.trimStart + (timeRef.current - start) * c.speed;
        el.playbackRate = Math.min(4, Math.max(0.25, c.speed));
        if (playing) {
          if (el.paused) {
            el.currentTime = want;
            el.play().catch(() => {});
          } else if (Math.abs(el.currentTime - want) > 0.5) el.currentTime = want;
        } else {
          if (!el.paused) el.pause();
          if (Math.abs(el.currentTime - want) > 0.04) el.currentTime = want;
        }
      });
    };

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const p = propsRef.current;
      const tl = buildTimeline(p.project.clips);
      if (playingRef.current) {
        timeRef.current += dt;
        if (timeRef.current >= tl.total) {
          timeRef.current = tl.total;
          finish();
        }
      }
      if (timeRef.current > tl.total) timeRef.current = tl.total;
      sync(tl);
      const canvas = canvasRef.current;
      const layers = layersRef.current;
      const changed =
        playingRef.current ||
        dirtyRef.current ||
        p.project !== lastProj ||
        timeRef.current !== lastT ||
        p.assets.current.size !== lastAssets ||
        now - lastRender > 250;
      if (canvas && layers && canvas.width === layers[0].width && changed && (visible || exportingRef.current)) {
        const idleAtStart = !playingRef.current && timeRef.current < 0.05;
        const proj = idleAtStart && p.project.fadeInOut ? { ...p.project, fadeInOut: false } : p.project;
        renderAt(canvas, layers, proj, p.assets.current, strokesRef.current, timeRef.current);
        dirtyRef.current = false;
        lastProj = p.project;
        lastT = timeRef.current;
        lastAssets = p.assets.current.size;
        lastRender = now;
      }
      if (Math.abs(timeRef.current - emitted) > 0.1) {
        emitted = timeRef.current;
        p.onTime(timeRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      watcher?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMusic = () => {
    const d = propsRef.current.sfx?.current;
    if (d && d.src) {
      d.currentTime = timeRef.current;
      d.play().catch(() => {});
    }
    const m = propsRef.current.music.current;
    if (!m || !m.src) return;
    if (isFinite(m.duration) && m.duration > 0) m.currentTime = timeRef.current % m.duration;
    m.play().catch(() => {});
  };

  const play = () => {
    const tl = buildTimeline(propsRef.current.project.clips);
    if (!tl.total) return;
    if (timeRef.current >= tl.total - 0.05) timeRef.current = 0;
    playingRef.current = true;
    startMusic();
    propsRef.current.onPlayingChange(true);
  };

  const pause = () => {
    playingRef.current = false;
    stopMedia();
    propsRef.current.onPlayingChange(false);
  };

  const toPoint = (e: ReactPointerEvent<HTMLCanvasElement>): [number, number] => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height];
  };

  const currentClipId = () => {
    const clips = propsRef.current.project.clips;
    return clips[activeClipIndex(clips, timeRef.current)]?.id;
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    const id = currentClipId();
    if (!c || !id || !props.drawing) return;
    if (playingRef.current) pause();
    c.setPointerCapture(e.pointerId);
    const scale = c.width / c.getBoundingClientRect().width;
    const stroke: Stroke = { color: props.color, size: props.size * scale, points: [toPoint(e)] };
    activeStroke.current = stroke;
    const list = strokesRef.current.get(id) ?? [];
    list.push(stroke);
    strokesRef.current.set(id, list);
  };

  useImperativeHandle(ref, () => ({
    play,
    pause,
    toggle: () => (playingRef.current ? pause() : play()),
    seek: (t) => {
      const tl = buildTimeline(propsRef.current.project.clips);
      timeRef.current = Math.min(Math.max(0, t), tl.total);
      if (playingRef.current) startMusic();
    },
    undo: () => {
      const id = currentClipId();
      if (id) strokesRef.current.get(id)?.pop();
      dirtyRef.current = true;
    },
    clear: () => {
      const id = currentClipId();
      if (id) strokesRef.current.set(id, []);
      dirtyRef.current = true;
    },
    exportGif: async (onProgress, signal) => {
      const canvas = canvasRef.current;
      const layers = layersRef.current;
      const p = propsRef.current;
      if (!canvas || !layers) throw new Error("not ready");
      pause();
      const total = Math.min(6, buildTimeline(p.project.clips).total || 3);
      const fps = 10;
      const blob = await buildGif({
        count: Math.max(1, Math.round(total * fps)),
        fps,
        maxWidth: 480,
        onProgress,
        signal,
        draw: (i) => {
          renderAt(canvas, layers, { ...p.project, fadeInOut: false }, p.assets.current, strokesRef.current, i / fps);
          return canvas;
        },
      });
      dirtyRef.current = true;
      return blob;
    },
    exportMedia: async (onProgress, signal) => {
      const canvas = canvasRef.current;
      const layers = layersRef.current;
      const p = propsRef.current;
      if (!canvas || !layers) throw new Error("not ready");
      const tl = buildTimeline(p.project.clips);
      const hasMusic = !!p.music.current?.src || !!p.sfx?.current?.src;

      if (
        p.project.clips.length === 1 &&
        p.project.clips[0].type === "photo" &&
        p.project.mode === "hand" &&
        !p.project.texts.length &&
        !hasMusic
      ) {
        pause();
        renderAt(canvas, layers, { ...p.project, fadeInOut: false }, p.assets.current, strokesRef.current, 0);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (!blob) throw new Error("png failed");
        return { blob, ext: "png" };
      }

      const mime = pickMime();
      if (!mime) throw new Error("recording unsupported");
      const stream = canvas.captureStream(30);
      const media: HTMLMediaElement[] = [];
      p.project.clips.forEach((c) => {
        const el = p.assets.current.get(c.assetId)?.el;
        if (c.type === "video" && el instanceof HTMLVideoElement && !media.includes(el)) media.push(el);
      });
      if (p.music.current?.src) media.push(p.music.current);
      if (p.sfx?.current?.src) media.push(p.sfx.current);
      exportingRef.current = true;
      const tracks = await routeAudio(media);
      tracks.forEach((t) => stream.addTrack(t));

      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      const stopped = new Promise<void>((res) => {
        recorder.onstop = () => res();
      });

      pause();
      timeRef.current = 0;
      const ended = new Promise<void>((res) => {
        endResolver.current = res;
      });
      const onAbort = () => {
        pause();
        endResolver.current?.();
        endResolver.current = null;
      };
      signal.addEventListener("abort", onAbort);
      recorder.start(1000);
      play();
      const timer = setInterval(() => onProgress(tl.total ? timeRef.current / tl.total : 0), 400);
      await ended;
      clearInterval(timer);
      signal.removeEventListener("abort", onAbort);
      recorder.stop();
      exportingRef.current = false;
      await stopped;
      if (signal.aborted) throw new Error("aborted");
      onProgress(1);
      return { blob: new Blob(chunks, { type: mime }), ext: mime.includes("mp4") ? "mp4" : "webm" };
    },
  }));

  return (
    <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-foreground">
      <canvas
        ref={canvasRef}
        aria-label="Preview"
        className={`block h-auto max-h-[48vh] w-auto max-w-full ${props.drawing ? "cursor-crosshair touch-none" : "touch-pan-y"}`}
        onPointerDown={onDown}
        onPointerMove={(e) => {
          if (!activeStroke.current) return;
          activeStroke.current.points.push(toPoint(e));
          dirtyRef.current = true;
        }}
        onPointerUp={() => (activeStroke.current = null)}
        onPointerCancel={() => (activeStroke.current = null)}
      />
    </div>
  );
});

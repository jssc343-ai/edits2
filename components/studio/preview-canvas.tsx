"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { EditKind, EditPlan, MediaItem, Stroke } from "@/lib/edit-types";
import { buildTimeline, drawFrame, locate, type Timeline } from "@/lib/render";

export const CANVAS_W = 720;
export const CANVAS_H = 960;

export interface PreviewHandle {
  snapshot: () => Promise<Blob | null>;
  record: (onProgress: (pct: number) => void) => Promise<{ blob: Blob; ext: string } | null>;
}

interface Props {
  kind: EditKind;
  plan: EditPlan;
  media: MediaItem[];
  strokes: Stroke[];
  playing: boolean;
  drawing: boolean;
  route: "ai" | "manual";
  brushColor: string;
  emptyText: string;
  onStrokesChange: (next: Stroke[]) => void;
  label: string;
}

function pickMime(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const options = [
    { mime: "video/mp4;codecs=avc1", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm;codecs=vp8", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  return options.find((o) => MediaRecorder.isTypeSupported(o.mime)) ?? null;
}

export const PreviewCanvas = forwardRef<PreviewHandle, Props>(function PreviewCanvas(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  const tlRef = useRef<Timeline>({ order: [], segs: [], total: 0 });
  const clockRef = useRef({ t: 0, last: 0 });
  const recordingRef = useRef(false);
  const activeSeg = useRef(-1);
  const currentStroke = useRef<Stroke | null>(null);
  const dirtyRef = useRef(true);

  useEffect(() => {
    propsRef.current = props;
    dirtyRef.current = true;
    tlRef.current = buildTimeline(props.kind, props.plan, props.media);
    activeSeg.current = -1;
  }, [props]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const p = propsRef.current;
      const tl = tlRef.current;
      const clock = clockRef.current;
      const recording = recordingRef.current;
      const idle = !recording && !p.playing && !currentStroke.current && !dirtyRef.current;
      if (idle || document.hidden) {
        clock.last = now;
        return;
      }
      if (!recording && now - clock.last < 33) return;
      const dt = clock.last ? (now - clock.last) / 1000 : 0;
      clock.last = now;
      dirtyRef.current = false;
      if (!recordingRef.current && p.playing) {
        clock.t += dt;
        if (tl.total > 0 && clock.t >= tl.total) clock.t = 0;
      }

      const { index } = locate(tl, clock.t);
      if (index !== activeSeg.current) {
        const prevSeg = tl.segs[activeSeg.current];
        const prevItem = prevSeg ? tl.order[prevSeg.mediaIndex] : undefined;
        if (prevItem?.el instanceof HTMLVideoElement) prevItem.el.pause();
        activeSeg.current = index;
        const seg = tl.segs[index];
        const item = seg ? tl.order[seg.mediaIndex] : undefined;
        if (item?.el instanceof HTMLVideoElement && seg) {
          item.el.currentTime = seg.start;
          item.el.muted = true;
          if (p.playing || recordingRef.current) item.el.play().catch(() => {});
        }
        const nextSeg = tl.segs[index + 1];
        const nextItem = nextSeg ? tl.order[nextSeg.mediaIndex] : undefined;
        if (nextItem?.el instanceof HTMLVideoElement && nextSeg) nextItem.el.currentTime = nextSeg.start;
      }

      drawFrame(ctx, CANVAS_W, CANVAS_H, {
        kind: p.kind,
        plan: p.plan,
        tl,
        t: clock.t,
        strokes: currentStroke.current ? [...p.strokes, currentStroke.current] : p.strokes,
        emptyText: p.emptyText,
        route: p.route,
        guides: p.drawing && !recordingRef.current,
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useImperativeHandle(ref, () => ({
    snapshot: () =>
      new Promise((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas) return resolve(null);
        canvas.toBlob((b) => resolve(b), "image/png");
      }),
    record: async (onProgress) => {
      const canvas = canvasRef.current;
      const picked = pickMime();
      const tl = tlRef.current;
      if (!canvas || !picked || tl.total <= 0) return null;

      recordingRef.current = true;
      clockRef.current.t = 0;
      activeSeg.current = -1;
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: 4_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      const done = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });
      recorder.start(500);

      const startedAt = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const elapsed = (performance.now() - startedAt) / 1000;
          clockRef.current.t = Math.min(elapsed, tl.total - 0.001);
          onProgress(Math.min(100, Math.round((elapsed / tl.total) * 100)));
          if (elapsed >= tl.total) resolve();
          else setTimeout(tick, 100);
        };
        tick();
      });

      recorder.stop();
      await done;
      stream.getTracks().forEach((track) => track.stop());
      recordingRef.current = false;
      clockRef.current.t = 0;
      activeSeg.current = -1;
      return { blob: new Blob(chunks, { type: picked.mime.split(";")[0] }), ext: picked.ext };
    },
  }));

  function point(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height];
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!props.drawing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    currentStroke.current = { color: props.brushColor, width: 0.01, points: [point(e)] };
  }
  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (currentStroke.current) currentStroke.current.points.push(point(e));
  }
  function onUp() {
    if (currentStroke.current) {
      props.onStrokesChange([...props.strokes, currentStroke.current]);
      currentStroke.current = null;
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      role="img"
      aria-label={props.label}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`h-full max-h-full w-auto max-w-full rounded-2xl bg-card shadow-2xl ${
        props.drawing ? "cursor-crosshair touch-none" : ""
      }`}
      style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
    />
  );
});

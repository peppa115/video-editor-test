'use client';

import React, { useRef, useState, useEffect } from 'react';

// Timeline Clip Resize Demo
// Single-file React component (Next.js client component) that demonstrates:
// - clip items on a timeline
// - left/right edge resize with mouse
// - snap to grid
// - simple overlap prevention per track
// - requestAnimationFrame-based updates for smoothness

export default function TimelineEditorDemo() {
  // Timeline config
  const PIXELS_PER_SECOND = 120; // scale (adjust to zoom in/out)
  const SNAP_SECONDS = 0.1; // snap grid in seconds
  const MIN_DURATION = 0.2; // seconds

  // Sample clips (multiple tracks possible)
  const [clips, setClips] = useState(() => [
    { id: 'c1', track: 0, start: 0.5, end: 3.0, label: 'Intro' },
    { id: 'c2', track: 0, start: 3.5, end: 6.2, label: 'Scene A' },
    { id: 'c3', track: 1, start: 1.0, end: 4.0, label: 'Music' },
  ]);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{
    clipId: string;
    edge: 'left' | 'right' | 'move';
    startX: number;
    startClip: { start: number; end: number };
    raf?: number;
  } | null>(null);

  // Helpers
  const secToPx = (s: number) => s * PIXELS_PER_SECOND;
  const pxToSec = (px: number) => px / PIXELS_PER_SECOND;
  const snap = (s: number) => Math.round(s / SNAP_SECONDS) * SNAP_SECONDS;

  // Prevent overlaps on same track (simple: clamp against neighbors)
  function clampClipToTrack(id: string, track: number, nextStart: number, nextEnd: number) {
    const same = clips
      .filter((c) => c.track === track && c.id !== id)
      .sort((a, b) => a.start - b.start);
    // ensure not negative
    let start = Math.max(0, nextStart);
    let end = Math.max(start + MIN_DURATION, nextEnd);

    for (let i = 0; i < same.length; i++) {
      const c = same[i];
      // if we overlap with c, push/pull
      if (start < c.end && end > c.start) {
        // if we are resizing left, try to clamp to c.end
        if (start < c.end && nextStart < start) {
          start = c.end;
          if (end <= start) end = start + MIN_DURATION;
        } else if (end > c.start && nextEnd > end) {
          end = c.start;
          if (end <= start) start = Math.max(0, end - MIN_DURATION);
        } else {
          // fallback: place after last
          start = Math.max(start, c.end);
          end = Math.max(end, start + MIN_DURATION);
        }
      }
    }
    return { start, end };
  }

  // Mouse handlers
  function onHandleMouseDown(e: React.MouseEvent, clipId: string, edge: 'left' | 'right' | 'move') {
    e.stopPropagation();
    const el = timelineRef.current;
    if (!el) return;
    const startX = e.clientX;
    const clip = clips.find((c) => c.id === clipId)!;
    draggingRef.current = {
      clipId,
      edge,
      startX,
      startClip: { start: clip.start, end: clip.end },
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    const drag = draggingRef.current;
    if (!drag) return;
    // throttle with rAF
    if (drag.raf) cancelAnimationFrame(drag.raf);
    drag.raf = requestAnimationFrame(() => {
      const dx = e.clientX - drag.startX;
      const dt = pxToSec(dx);
      setClips((prev) => {
        return prev.map((c) => {
          if (c.id !== drag.clipId) return c;
          let start = drag.startClip.start;
          let end = drag.startClip.end;
          if (drag.edge === 'left') {
            start = snap(Math.max(0, drag.startClip.start + dt));
            // clamp min duration
            if (end - start < MIN_DURATION) start = end - MIN_DURATION;
            // clamp to neighbors
            ({ start, end } = clampClipToTrack(c.id, c.track, start, end));
          } else if (drag.edge === 'right') {
            end = snap(Math.max(drag.startClip.start + MIN_DURATION, drag.startClip.end + dt));
            ({ start, end } = clampClipToTrack(c.id, c.track, start, end));
          } else if (drag.edge === 'move') {
            // move whole clip
            const dur = drag.startClip.end - drag.startClip.start;
            let newStart = snap(Math.max(0, drag.startClip.start + dt));
            let newEnd = newStart + dur;
            ({ start, end } = clampClipToTrack(c.id, c.track, newStart, newEnd));
          }
          return { ...c, start, end };
        });
      });
    });
  }

  function onMouseUp() {
    const drag = draggingRef.current;
    if (drag?.raf) cancelAnimationFrame(drag.raf);
    draggingRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  // Add new clip helper
  function addClip(track = 0) {
    const maxEnd = clips.reduce((m, c) => Math.max(m, c.end), 0);
    const id = 'c' + Math.random().toString(36).slice(2, 7);
    setClips((p) => [...p, { id, track, start: maxEnd + 0.2, end: maxEnd + 2.0, label: 'New' }]);
  }

  // Render
  const totalSeconds = Math.max(8, ...clips.map((c) => c.end));
  const rulerMarks = [] as number[];
  for (let s = 0; s <= Math.ceil(totalSeconds); s += 0.5) rulerMarks.push(+s.toFixed(2));

  return (
    <div className="p-6 font-sans">
      <h2 className="text-lg font-semibold mb-3">Timeline Clip Resize Demo</h2>

      <div className="mb-3 flex gap-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => addClip(0)}
        >
          Add Clip (Track 0)
        </button>
        <button
          className="px-3 py-1 bg-gray-700 text-white rounded"
          onClick={() => addClip(1)}
        >
          Add Clip (Track 1)
        </button>
        <div className="ml-auto text-sm text-gray-600">Snap: {SNAP_SECONDS}s • Scale: {PIXELS_PER_SECOND}px/s</div>
      </div>

      <div className="border rounded overflow-hidden">
        {/* Ruler */}
        <div className="bg-gray-100 px-2 py-1 border-b">
          <div className="relative h-6">
            <div className="absolute left-0 top-0 bottom-0 flex items-center gap-2">
              {rulerMarks.map((s) => (
                <div key={s} style={{ left: secToPx(s) }} className="absolute -top-1 text-xs">
                  <div className="h-2" />
                  <div className="text-gray-600">{s % 1 === 0 ? s : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline area */}
        <div ref={timelineRef} className="relative bg-white" style={{ height: 200 }}>
          {/* grid background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative h-full">
              {/* vertical grid lines */}
              {Array.from({ length: Math.ceil(totalSeconds) * 2 + 1 }).map((_, i) => {
                const x = i * 0.5 * PIXELS_PER_SECOND;
                return (
                  <div key={i} style={{ left: x }} className="absolute top-0 bottom-0 w-px bg-gray-100" />
                );
              })}
            </div>
          </div>

          {/* tracks */}
          {[0, 1].map((trackIndex) => (
            <div key={trackIndex} className="relative h-24 border-b">
              {/* render clips on this track */}
              {clips.filter((c) => c.track === trackIndex).map((c) => {
                const left = secToPx(c.start);
                const width = secToPx(c.end - c.start);
                return (
                  <div
                    key={c.id}
                    className="absolute top-2 h-20 rounded shadow-md select-none"
                    style={{ left, width }}
                  >
                    <div
                      className="h-full bg-gradient-to-br from-indigo-500 to-indigo-700 rounded flex items-center justify-between text-white text-sm"
                      onMouseDown={(e) => onHandleMouseDown(e, c.id, 'move')}
                      style={{ paddingLeft: 8, paddingRight: 8 }}
                    >
                      <div className="truncate" style={{ maxWidth: Math.max(20, width - 60) }}>{c.label}</div>

                      {/* right handle */}
                      <div
                        className="w-3 h-full cursor-ew-resize flex items-center justify-center"
                        onMouseDown={(e) => onHandleMouseDown(e, c.id, 'right')}
                      >
                        <div className="w-1 h-10 bg-white/50 rounded" />
                      </div>

                      {/* left handle (absolute positioned) */}
                      <div
                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12 }}
                        onMouseDown={(e) => onHandleMouseDown(e, c.id, 'left')}
                        className="cursor-ew-resize"
                      >
                        <div style={{ width: 6, height: 24, marginLeft: 2 }} className="bg-white/50 rounded" />
                      </div>
                    </div>
                    {/* label below with time */}
                    <div className="absolute -bottom-5 left-0 text-xs text-gray-600 bg-white px-1 rounded">
                      {c.start.toFixed(2)}s - {c.end.toFixed(2)}s
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        Tips: drag the left or right edge to resize. Drag the middle area to move. Grid snap and simple overlap prevention enabled.
      </div>
    </div>
  );
}

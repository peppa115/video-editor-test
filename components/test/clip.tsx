'use client';

import { Rnd } from 'react-rnd';
// import { useTimelineStore } from '@/stores/timeline-store';
import { useMemo } from 'react';

interface ClipProps {
  id: string;
  start: number; // 秒
  end: number; // 秒
  trackId: string;
}

export function Clip({ id, start, end, trackId }: ClipProps) {
  // const { scale, updateClipPosition } = useTimelineStore();
  const scale = 2;


  const width = useMemo(() => (end - start) * scale, [end, start, scale]);
  const x = useMemo(() => start * scale, [start, scale]);

  return (
    <Rnd
      size={{ width, height: 40 }}
      position={{ x, y: 0 }}
      minWidth={20}
      bounds="parent"
      enableResizing={{ left: true, right: true }}
      onDragStop={(_, data) => {
        const newStart = data.x / scale;
        const duration = end - start;
        // updateClipPosition(id, { start: newStart, end: newStart + duration });
      }}
      onResizeStop={(_, dir, ref, delta, position) => {
        const newStart = position.x / scale;
        const newEnd = (position.x + ref.offsetWidth) / scale;
        // updateClipPosition(id, { start: newStart, end: newEnd });
      }}
      className="absolute bg-blue-500/70 text-xs text-white rounded-sm flex items-center justify-center cursor-move select-none"
    >
      {id}
    </Rnd>
  );
}

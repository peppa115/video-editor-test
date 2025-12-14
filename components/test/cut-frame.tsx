'use client';

import { useEffect, useRef, useState } from 'react';

interface FramePreviewTrackProps {
  videoSrc?: string; // 视频地址
  scale: number;    // 缩放倍数（外部slider控制，范围比如 1 ~ 10）
}

export default function FramePreviewTrack({ scale }: FramePreviewTrackProps) {
    const videoSrc = "https://cdn.video-ocean.com/vo_serving_data/2025/week_39/97492c9c-620f-43c1-8e6d-431dfa187f86.mp4";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [frameWidth, setFrameWidth] = useState(60); // 每帧宽度
  const [visibleCount, setVisibleCount] = useState(0);

  // 抽帧：这里抽 100 帧，缓存下来
  useEffect(() => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    const captureFrames = async () => {
      await video.play().catch(() => {}); 
      video.pause();

      const duration = video.duration;
      const frameCount = 100; // 全量缓存 100 帧
      const interval = duration / frameCount;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const result: string[] = [];

      for (let i = 0; i < frameCount; i++) {
        video.currentTime = i * interval;
        await new Promise(r => {
          video.onseeked = r;
        });
        canvas.width = video.videoWidth / 6;
        canvas.height = video.videoHeight / 6;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        result.push(canvas.toDataURL('image/jpeg'));
      }
      setFrames(result);
    };

    video.onloadedmetadata = captureFrames;
  }, [videoSrc]);

  // 监听容器宽度，算能放多少帧
  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const fw = frameWidth * scale;
      setVisibleCount(Math.ceil(w / fw) + 1); // 半帧情况 +1
    };
    calc();

    const resizeObserver = new ResizeObserver(calc);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [scale, frameWidth]);

  // 从全量帧里，均匀抽 visibleCount 个
  const sampledFrames = (() => {
    if (frames.length === 0 || visibleCount === 0) return [];
    const step = frames.length / visibleCount;
    const arr: string[] = [];
    for (let i = 1; i <= visibleCount; i++) {
      const idx = Math.min(frames.length - 1, Math.floor(i * step) - 1);
      arr.push(frames[idx]);
    }
    return arr;
  })();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-24 bg-gray-900 overflow-hidden"
    >
      <div className="flex h-full">
        {sampledFrames.map((frame, idx) => (
          <img
            key={idx}
            src={frame}
            style={{
              // width: frameWidth * scale,
              height: '100%',
              objectFit: 'contain',
            }}
            className="shrink-0"
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useRef, useEffect, useState } from "react";

// 单个分视频片段定义
export interface Clip {
  id: string;
  src: string;
  duration: number; // 秒
}

interface VideoEditorPreviewProps {
  clips: Clip[];
  width?: number;
  height?: number;
  crossfade?: number; // 交叉淡入淡出时间 (s)
}

export default function VideoEditorPreview ({
 
  width = 640,
  height = 360,
  crossfade = 0.15,
}) {
 const clips = [
    {
      id: "clip1",
      src: "https://cdn.video-ocean.com/vo_serving_data/2025/week_37/3b449d1f-5b4d-4be7-b36a-6ecb74a832a3.mp4",
      duration: 8,
    },
    {
      id: "clip2",
      src: "https://cdn.video-ocean.com/vo_serving_data/2025/week_37/535aa00a-571f-4c12-8ab5-4bcd40819d39.mp4",
      duration: 5,
    },
    {
      id: "clip3",
      src: "https://cdn.video-ocean.com/vo_serving_data/2025/week_37/c9eb26b3-e8d6-404d-b4cc-1b6d031e8b7c.mp4",
      duration: 5,
    }
  ]
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 总时长
  const totalDuration = clips.reduce((acc, c) => acc + c.duration, 0);

  // 当前在哪个片段
  const findClipIndex = (time: number) => {
    let acc = 0;
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (time >= acc && time < acc + clip.duration) {
        return { index: i, offset: time - acc };
      }
      acc += clip.duration;
    }
    return { index: clips.length - 1, offset: clips[clips.length - 1].duration };
  };

  // 渲染循环 (requestAnimationFrame)
  useEffect(() => {
    let rafId: number;
    let startTime = 0;

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      if (isPlaying) {
        const elapsed = (timestamp - startTime) / 1000;
        const newTime = Math.min(currentTime + elapsed, totalDuration);
        setCurrentTime(newTime);
        startTime = timestamp;
      } else {
        startTime = timestamp;
      }

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current!;
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, width, height);

        const { index, offset } = findClipIndex(currentTime);
        const currentClip = clips[index];
        const currentVideo = videoRefs.current[currentClip.id];

        if (currentVideo) {
          currentVideo.currentTime = offset;
          ctx.globalAlpha = 1;
          ctx.drawImage(currentVideo, 0, 0, width, height);
        }

        // crossfade
        if (currentClip && currentClip.duration - offset < crossfade && index < clips.length - 1) {
          const nextClip = clips[index + 1];
          const nextVideo = videoRefs.current[nextClip.id];
          if (nextVideo) {
            nextVideo.currentTime = 0;
            const fade = 1 - (currentClip.duration - offset) / crossfade;
            ctx.globalAlpha = fade;
            ctx.drawImage(nextVideo, 0, 0, width, height);
            ctx.globalAlpha = 1;
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, currentTime, totalDuration, clips, width, height, crossfade]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px`, background: "black" }}
      />

      {/* 隐藏 video 元素用于解码 */}
      {clips.map((clip) => (
        <video
          key={clip.id}
          ref={(el) => {
            if (el) videoRefs.current[clip.id] = el;
          }}
          src={clip.src}
          preload="auto"
          muted
          playsInline
          style={{ display: "none" }}
        />
      ))}

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => setIsPlaying((p) => !p)}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
};

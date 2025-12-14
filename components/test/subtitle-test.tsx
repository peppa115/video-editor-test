'use client';

import { useEffect, useRef, useState } from 'react';

export default function SubtitleTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const subtitleCanvasRef = useRef<HTMLCanvasElement>(null);

  const [showSubtitle, setShowSubtitle] = useState(true);
  const [fontSize, setFontSize] = useState(28);
  const [isBold, setIsBold] = useState(false);

  // 模拟字幕时间轴
  const subtitles = [
    { start: 0, end: 3, text: '你好，欢迎来到视频剪辑示例！' },
    { start: 3, end: 6, text: '这是一段展示字幕层独立控制的 Demo。' },
    { start: 6, end: 9, text: '字幕可以单独隐藏、修改样式。' },
  ];

  useEffect(() => {
    const video = videoRef.current!;
    const videoCanvas = videoCanvasRef.current!;
    const subtitleCanvas = subtitleCanvasRef.current!;
    const vCtx = videoCanvas.getContext('2d')!;
    const sCtx = subtitleCanvas.getContext('2d')!;

    let animationFrame: number;

    const render = () => {
      if (!video.paused && !video.ended) {
        vCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
      }

      sCtx.clearRect(0, 0, subtitleCanvas.width, subtitleCanvas.height);

      if (showSubtitle) {
        const current = video.currentTime;
        const sub = subtitles.find((s) => current >= s.start && current <= s.end);
        if (sub) {
          sCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px sans-serif`;
          sCtx.textAlign = 'center';
          sCtx.fillStyle = 'white';
          sCtx.strokeStyle = 'black';
          sCtx.lineWidth = 4;
          const x = subtitleCanvas.width / 2;
          const y = subtitleCanvas.height - 40;
          sCtx.strokeText(sub.text, x, y);
          sCtx.fillText(sub.text, x, y);
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    video.play();
    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [showSubtitle, fontSize, isBold]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 bg-neutral-900 text-white">
      <div className="relative w-[640px] h-[360px] border border-neutral-700">
        <canvas
          ref={videoCanvasRef}
          width={640}
          height={360}
          className="absolute top-0 left-0 w-full h-full"
        />
        <canvas
          ref={subtitleCanvasRef}
          width={640}
          height={360}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <video
          ref={videoRef}
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSubtitle((v) => !v)}
          className="px-3 py-1 bg-blue-600 rounded-md hover:bg-blue-500"
        >
          {showSubtitle ? '隐藏字幕' : '显示字幕'}
        </button>

        <button
          onClick={() => setIsBold((v) => !v)}
          className="px-3 py-1 bg-purple-600 rounded-md hover:bg-purple-500"
        >
          {isBold ? '取消加粗' : '加粗'}
        </button>

        <label className="flex items-center gap-2">
          字号：
          <input
            type="number"
            value={fontSize}
            min={10}
            max={80}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-20 text-black rounded-md px-2 py-1"
          />
        </label>
      </div>
    </div>
  );
}

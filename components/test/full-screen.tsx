'use client';
import React, { useRef, useEffect, useState } from 'react';

const BASE_WIDTH = 630;
const BASE_HEIGHT = 354;

type Mode = 'none' | 'move' | 'resize';

export default function CanvasVideoEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>('none');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // 视频区域（矩形）
  const [rect, setRect] = useState({
    x: 100,
    y: 80,
    width: 200,
    height: 120,
  });

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // 背景
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // 视频矩形
    ctx.fillStyle = isPlaying ? '#ff4444' : '#6666ff';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 四角
    ctx.fillStyle = '#fff';
    const size = 8;
    const corners = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x, rect.y + rect.height],
      [rect.x + rect.width, rect.y + rect.height],
    ];
    corners.forEach(([x, y]) => {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    });

    ctx.restore();
  };

  const handleResize = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const { clientWidth, clientHeight } = container;

    canvas.width = clientWidth * dpr;
    canvas.height = clientHeight * dpr;
    canvas.style.width = `${clientWidth}px`;
    canvas.style.height = `${clientHeight}px`;

    const scaleRatio = Math.min(clientWidth / BASE_WIDTH, clientHeight / BASE_HEIGHT);
    setScale(scaleRatio);

    const ctx = canvas.getContext('2d');
    ctx?.scale(dpr, dpr);

    draw();
  };

  const getLogicCoords = (e: React.MouseEvent) => {
    const rectCanvas = canvasRef.current?.getBoundingClientRect();
    if (!rectCanvas) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rectCanvas.left) / scale,
      y: (e.clientY - rectCanvas.top) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getLogicCoords(e);
    const { x, y, width, height } = rect;
    const size = 10;

    // 判断是否点在四角
    const corners = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x, y: y + height },
      { x: x + width, y: y + height },
    ];

    const isOnCorner = corners.some(
      (c) => Math.abs(pos.x - c.x) < size && Math.abs(pos.y - c.y) < size
    );

    if (isOnCorner) {
      setMode('resize');
    } else if (
      pos.x > x &&
      pos.x < x + width &&
      pos.y > y &&
      pos.y < y + height
    ) {
      setMode('move');
      setOffset({ x: pos.x - x, y: pos.y - y });
    } else {
      setMode('none');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === 'none') return;
    const pos = getLogicCoords(e);

    if (mode === 'move') {
      setRect((prev) => ({
        ...prev,
        x: pos.x - offset.x,
        y: pos.y - offset.y,
      }));
    } else if (mode === 'resize') {
      setRect((prev) => ({
        ...prev,
        width: Math.max(50, pos.x - prev.x),
        height: Math.max(50, pos.y - prev.y),
      }));
    }
  };

  const handleMouseUp = () => setMode('none');

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, []);

  useEffect(draw, [rect, scale, isPlaying]);

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-[630px] h-[354px] flex items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="bg-gray-800 cursor-crosshair rounded-lg"
      />

      {/* 全屏按钮 */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded"
      >
        {isFullscreen ? '退出全屏' : '全屏'}
      </button>

      {/* 播放按钮，仅全屏显示 */}
      {isFullscreen && (
        <button
          onClick={togglePlay}
          className="absolute bottom-6 right-6 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full"
        >
          {isPlaying ? '暂停' : '播放'}
        </button>
      )}
    </div>
  );
}

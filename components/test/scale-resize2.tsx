'use client';

import { useRef, useState, useEffect } from 'react';

interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CanvasDragResizeDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(100);
  const [lockAspect, setLockAspect] = useState(true); // 是否等比缩放

  const [rect, setRect] = useState<ImageRect>({
    x: 300,
    y: 150,
    width: 200,
    height: 150,
  });

  const [draggingCorner, setDraggingCorner] = useState<string | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // 加载图片
  useEffect(() => {
    const image = new Image();
    image.src = 'https://cdn.video-ocean.com/vo_serving_data/2025/week_37/5025be33-2a66-423e-a69a-36c62d29deeb.png'; // 你可以换成自己的图像
    image.onload = () => setImg(image);
  }, []);

  // 绘制逻辑
  useEffect(() => {
    if (!img) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const userScale = zoom / 100;

    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 缩放 + 居中
    ctx.setTransform(dpr * userScale, 0, 0, dpr * userScale, 0, 0);

    // 绘制图像
    ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);

    // 绘制拖拽点
    const corners = getCorners(rect);
    ctx.fillStyle = '#00bcd4';
    for (const c of corners) {
      ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
    }
  }, [img, rect, zoom]);

  // 获取四角位置
  const getCorners = (r: ImageRect) => [
    { name: 'tl', x: r.x, y: r.y },
    { name: 'tr', x: r.x + r.width, y: r.y },
    { name: 'bl', x: r.x, y: r.y + r.height },
    { name: 'br', x: r.x + r.width, y: r.y + r.height },
  ];

  // 判断点击是否在 corner 上
  const getCornerAt = (x: number, y: number) => {
    for (const c of getCorners(rect)) {
      if (Math.abs(x - c.x) < 8 && Math.abs(y - c.y) < 8) return c.name;
    }
    return null;
  };

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rectBound = canvas.getBoundingClientRect();
    const x = (e.clientX - rectBound.left) / (zoom / 100);
    const y = (e.clientY - rectBound.top) / (zoom / 100);
    const corner = getCornerAt(x, y);
    if (corner) {
      setDraggingCorner(corner);
      setStartPos({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingCorner || !startPos) return;
    const canvas = canvasRef.current!;
    const rectBound = canvas.getBoundingClientRect();
    const x = (e.clientX - rectBound.left) / (zoom / 100);
    const y = (e.clientY - rectBound.top) / (zoom / 100);

    const dx = x - startPos.x;
    const dy = y - startPos.y;

    setRect((prev) => {
      const newRect = { ...prev };
      const aspect = prev.width / prev.height;

      switch (draggingCorner) {
        case 'tl':
          newRect.x += dx;
          newRect.y += dy;
          newRect.width -= dx;
          newRect.height -= dy;
          break;
        case 'tr':
          newRect.y += dy;
          newRect.width += dx;
          newRect.height -= dy;
          break;
        case 'bl':
          newRect.x += dx;
          newRect.width -= dx;
          newRect.height += dy;
          break;
        case 'br':
          newRect.width += dx;
          newRect.height += dy;
          break;
      }

      // 等比缩放时修正
      if (lockAspect) {
        const centerX = prev.x + prev.width / 2;
        const centerY = prev.y + prev.height / 2;

        const scale = Math.max(newRect.width / prev.width, newRect.height / prev.height);
        const newW = prev.width * scale;
        const newH = prev.height * scale;

        newRect.width = newW;
        newRect.height = newH;
        newRect.x = centerX - newW / 2;
        newRect.y = centerY - newH / 2;
      }

      return newRect;
    });

    setStartPos({ x, y });
  };

  const handleMouseUp = () => {
    setDraggingCorner(null);
    setStartPos(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 select-none">
      <div className="relative w-[800px] h-[450px] border border-gray-500 rounded-xl bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-300">Zoom:</label>
        <input
          type="range"
          min="50"
          max="500"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <span className="text-sm w-12 text-right">{zoom}%</span>

        <button
          onClick={() => setLockAspect((v) => !v)}
          className="px-3 py-1 border rounded text-sm bg-gray-800 hover:bg-gray-700 text-white"
        >
          {lockAspect ? '🔒 等比缩放' : '🔓 非等比缩放'}
        </button>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [box, setBox] = useState({
    x: 100,
    y: 150,
    width: 300,
    height: 150,
  });
  const [draggingCorner, setDraggingCorner] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const text = '这是一段非常长的字幕文字，用于测试在 Canvas 上自动换行和边框拖拽功能。';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    draw(ctx);
  }, [box]);

  /** 绘制逻辑 */
  function draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 边框
    ctx.strokeStyle = '#00bfff';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // 四角点
    const corners = getCorners();
    ctx.fillStyle = '#00bfff';
    corners.forEach(c => ctx.fillRect(c.x - 4, c.y - 4, 8, 8));

    // 字幕
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'white';
    drawWrappedText(ctx, text, box.x + 10, box.y + 30, box.width - 20, 32);
  }

  /** 自动换行绘制文字 */
  function drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const chars = text.split('');
    let line = '';
    const lines: string[] = [];

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const { width } = ctx.measureText(testLine);
      if (width > maxWidth && i > 0) {
        lines.push(line);
        line = chars[i];
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    lines.forEach((l, i) => {
      ctx.fillText(l, x, y + i * lineHeight);
    });
  }

  /** 获取四个角的坐标 */
  function getCorners() {
    const { x, y, width, height } = box;
    return [
      { x, y, name: 'tl' },
      { x: x + width, y, name: 'tr' },
      { x, y: y + height, name: 'bl' },
      { x: x + width, y: y + height, name: 'br' },
    ];
  }

  /** 鼠标事件 */
  function handleMouseDown(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const corner = getCorners().find(
      c => Math.abs(c.x - mouseX) < 8 && Math.abs(c.y - mouseY) < 8
    );
    if (corner) {
      setDraggingCorner(corner.name);
      setStartPos({ x: mouseX, y: mouseY });
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!draggingCorner) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = mouseX - startPos.x;
    const dy = mouseY - startPos.y;

    setBox(prev => {
      let { x, y, width, height } = prev;
      switch (draggingCorner) {
        case 'tl':
          x += dx;
          y += dy;
          width -= dx;
          height -= dy;
          break;
        case 'tr':
          y += dy;
          width += dx;
          height -= dy;
          break;
        case 'bl':
          x += dx;
          width -= dx;
          height += dy;
          break;
        case 'br':
          width += dx;
          height += dy;
          break;
      }
      return { x, y, width: Math.max(50, width), height: Math.max(50, height) };
    });

    setStartPos({ x: mouseX, y: mouseY });
  }

  function handleMouseUp() {
    setDraggingCorner(null);
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <canvas
        ref={canvasRef}
        className="border border-gray-600"
        width={800}
        height={450}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ width: 800, height: 450 }}
      />
    </div>
  );
}

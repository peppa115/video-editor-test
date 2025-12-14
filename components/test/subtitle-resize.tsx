'use client';
import { useEffect, useRef, useState } from 'react';

export default function SubtitleResize() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [subtitleBox, setSubtitleBox] = useState({
    x: 100,
    y: 150,
    width: 300,
    height: 150,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draggingCorner, setDraggingCorner] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const text =
    '这是一段非常长的字幕文字，用于测试在 Canvas 上自动换行显示效果。支持拖拽边框来改变换行。';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    drawText(ctx);
  }, [subtitleBox]);

  function drawText(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'white';

    // 文字从边框左上角开始绘制，稍微往下留一点行高
    drawWrappedText(ctx, text, subtitleBox.x, subtitleBox.y + 24, subtitleBox.width, 32);
  }

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

  /** 鼠标事件 - 拖拽边框和角 */
  function handleMouseDown(e: React.MouseEvent, corner?: string) {
    e.stopPropagation();
    setStartPos({ x: e.clientX, y: e.clientY });
    if (corner) {
      setDraggingCorner(corner);
    } else {
      setIsDragging(true);
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging && !draggingCorner) return;

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    setSubtitleBox(prev => {
      let { x, y, width, height } = prev;

      if (isDragging) {
        x += dx;
        y += dy;
      } else if (draggingCorner) {
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
      }

      return {
        x,
        y,
        width: Math.max(100, width),
        height: Math.max(60, height),
      };
    });

    setStartPos({ x: e.clientX, y: e.clientY });
  }

  function handleMouseUp() {
    setIsDragging(false);
    setDraggingCorner(null);
  }

  return (
    <div
      className="relative flex items-center justify-center h-screen bg-black select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="border border-gray-700"
        width={800}
        height={450}
        style={{ width: 800, height: 450 }}
      />

      {/* 字幕边框层（div） */}
      <div
        className="absolute border-2 border-sky-400 cursor-move"
        style={{
          left: subtitleBox.x,
          top: subtitleBox.y,
          width: subtitleBox.width,
          height: subtitleBox.height,
        }}
        onMouseDown={e => handleMouseDown(e)}
      >
        {/* 四角拖拽点 */}
        {['tl', 'tr', 'bl', 'br'].map(corner => {
          const position: Record<string, string> = {
            tl: 'top-0 left-0',
            tr: 'top-0 right-0',
            bl: 'bottom-0 left-0',
            br: 'bottom-0 right-0',
          };
          const cursor: Record<string, string> = {
            tl: 'nwse-resize',
            tr: 'nesw-resize',
            bl: 'nesw-resize',
            br: 'nwse-resize',
          };
          return (
            <div
              key={corner}
              className={`absolute w-3 h-3 bg-sky-400 ${position[corner]}`}
              style={{ cursor: cursor[corner], transform: 'translate(-50%, -50%)' }}
              onMouseDown={e => handleMouseDown(e, corner)}
            />
          );
        })}
      </div>
    </div>
  );
}

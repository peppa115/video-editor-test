'use client';

import { useRef, useEffect, useState } from 'react';

export default function CanvasZoomDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(100); // 用户控制缩放 (百分比)
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  // 加载图片
  useEffect(() => {
    const image = new Image();
    image.src = 'https://cdn.video-ocean.com/vo_serving_data/2025/week_37/5025be33-2a66-423e-a69a-36c62d29deeb.png'; // ✅ 你可以换成任何图片路径
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

    // 调整画布像素尺寸（考虑 DPR）
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    // 清空
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 居中缩放逻辑
    const centerX = canvas.clientWidth / 2;
    const centerY = canvas.clientHeight / 2;

    // 设置变换矩阵 (先平移到中心 -> 缩放 -> 再平移回去)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(centerX, centerY);
    ctx.scale(userScale, userScale);
    ctx.translate(-centerX, -centerY);

    // 图像尺寸
    const imgW = img.width;
    const imgH = img.height;
    const x = (canvas.clientWidth - imgW) / 2;
    const y = (canvas.clientHeight - imgH) / 2;

    // 绘制图像（会自动受 scale 影响）
    ctx.drawImage(img, x, y, imgW, imgH);
  }, [img, zoom]);

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="relative w-[800px] h-[450px] border border-gray-400 rounded-xl overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: '#111' }}
        />
      </div>

      <div className="flex items-center gap-3 w-[400px]">
        <label className="text-sm text-gray-300">Zoom: </label>
        <input
          type="range"
          min="0"
          max="500"
          step="1"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm w-16 text-right">{zoom}%</span>
      </div>
    </div>
  );
}

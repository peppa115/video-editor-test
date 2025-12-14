"use client";
import { useRef, useState, useEffect } from "react";

type Asset = {
  id: string;
  x: number; // 逻辑坐标 px
  y: number;
  width: number;
  height: number;
  color: string;
};

export default function CanvasWithForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1); // 画布缩放
  const [assets, setAssets] = useState<Asset[]>([
    { id: "1", x: 100, y: 100, width: 100, height: 80, color: "red" },
    { id: "2", x: 300, y: 200, width: 120, height: 90, color: "blue" },
  ]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usePercent, setUsePercent] = useState(false); // 是否显示百分比

  // 画布渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);

    assets.forEach((asset) => {
      ctx.fillStyle = asset.color;
      ctx.fillRect(asset.x, asset.y, asset.width, asset.height);

      // 选中高亮
      if (asset.id === selectedId) {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2 / scale; // 缩放补偿
        ctx.strokeRect(asset.x, asset.y, asset.width, asset.height);
      }
    });

    ctx.restore();
  }, [assets, scale, selectedId]);

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    for (let i = assets.length - 1; i >= 0; i--) {
      const a = assets[i];
      if (x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height) {
        setDraggingId(a.id);
        setOffset({ x: x - a.x, y: y - a.y });
        setSelectedId(a.id);
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setAssets((prev) =>
      prev.map((a) =>
        a.id === draggingId
          ? { ...a, x: x - offset.x, y: y - offset.y }
          : a
      )
    );
  };

  const handleMouseUp = () => setDraggingId(null);

  // 表单输入改变
  const handleInputChange = (key: "x" | "y", value: number) => {
    if (!selectedId) return;
    const canvas = canvasRef.current!;
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id !== selectedId) return a;
        if (usePercent) {
          return {
            ...a,
            [key]: key === "x" ? value * canvas.width : value * canvas.height,
          };
        } else {
          return { ...a, [key]: value };
        }
      })
    );
  };

  // 获取表单显示值
  const getDisplayValue = (asset: Asset, key: "x" | "y") => {
    const canvas = canvasRef.current!;
    if (!canvas) return asset[key];
    return usePercent
      ? +(asset[key] / (key === "x" ? canvas.width : canvas.height)).toFixed(4)
      : Math.round(asset[key]);
  };

  // 发送到后端
  const handleSendToBackend = () => {
    const canvas = canvasRef.current!;
    const data = assets.map((a) => ({
      id: a.id,
      x: a.x / canvas.width,
      y: a.y / canvas.height,
      width: a.width / canvas.width,
      height: a.height / canvas.height,
    }));
    console.log("Send to backend:", data);
  };

  const selectedAsset = assets.find((a) => a.id === selectedId);

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setScale((s) => s * 1.1)}>放大</button>
        <button onClick={() => setScale((s) => s / 1.1)}>缩小</button>
        <button onClick={handleSendToBackend}>Send to backend</button>
        <label style={{ marginLeft: 10 }}>
          <input
            type="checkbox"
            checked={usePercent}
            onChange={(e) => setUsePercent(e.target.checked)}
          />
          Display %
        </label>
      </div>

      {selectedAsset && (
        <div style={{ marginBottom: 10 }}>
          <label>
            X:{" "}
            <input
              type="number"
              value={getDisplayValue(selectedAsset, "x")}
              step={usePercent ? 0.001 : 1}
              onChange={(e) =>
                handleInputChange("x", parseFloat(e.target.value))
              }
            />
          </label>
          <label style={{ marginLeft: 10 }}>
            Y:{" "}
            <input
              type="number"
              value={getDisplayValue(selectedAsset, "y")}
              step={usePercent ? 0.001 : 1}
              onChange={(e) =>
                handleInputChange("y", parseFloat(e.target.value))
              }
            />
          </label>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ border: "1px solid black" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}

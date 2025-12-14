"use client";

import { MasonryGrid } from "@egjs/react-grid";
import { useEffect, useState, useRef, useCallback } from "react";

type Ratio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const ratios: Ratio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];

// 随机创建 item（模拟接口数据）
function createRandomItem(id: number) {
  const ratio = ratios[Math.floor(Math.random() * ratios.length)];
  return {
    id,
    ratio,
    src: `https://picsum.photos/seed/${id}/400/400`,
  };
}

// 模拟异步请求
function mockFetchData(startId: number, count = 20) {
  return new Promise<{ id: number; ratio: Ratio; src: string }[]>(resolve => {
    setTimeout(() => {
      const items = Array.from({ length: count }).map((_, i) =>
        createRandomItem(startId + i)
      );
      resolve(items);
    }, 500);
  });
}

export default function WaterfallVirtualListDemo() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const nextId = useRef(0);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const newItems = await mockFetchData(nextId.current, 20);
    nextId.current += 20;

    setItems(prev => [...prev, ...newItems]);
    setLoading(false);
    loadingRef.current = false;
  }, []);

  // 初次加载
  useEffect(() => {
    loadMore();
  }, []);

  // 触底加载 — IntersectionObserver
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bottomRef.current) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // 根据宽高比返回容器高度
  const getRatioStyle = (ratio: Ratio) => {
    switch (ratio) {
      case "1:1":
        return "pb-[100%]";
      case "16:9":
        return "pb-[56.25%]";
      case "9:16":
        return "pb-[177.77%]";
      case "4:3":
        return "pb-[75%]";
      case "3:4":
        return "pb-[133.33%]";
    }
  };

  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-bold mb-4">瀑布流 + 虚拟列表 + 触底加载</h2>

      <MasonryGrid
        gap={16}
        column={4}
        useResizeObserver
        preserveUIOnDestroy
        useTransform={false}
        virtual={{
          useVirtual: true,
          padding: 300, // 预加载300px
        }}
      >
        {items.map(item => (
          <div key={item.id} className="relative w-1/4 bg-gray-200 rounded-lg overflow-hidden">
            <div className={`relative w-full ${getRatioStyle(item.ratio)}`}>
              <img
                src={item.src}
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
              />
            </div>
          </div>
        ))}
      </MasonryGrid>

      {/* 触底加载监听器 */}
      <div ref={bottomRef} className="h-10"></div>

      {loading && <p className="text-center py-4 text-gray-500">加载中…</p>}
    </div>
  );
}

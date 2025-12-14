"use client";

import React, { useState } from "react";
import { MasonryInfiniteGrid } from "@egjs/react-infinitegrid";

type FeedItem = {
  id: string;
  width: number;
  height: number;
  src: string;
};

const randRatio = () => {
  const ratios = [
    [1, 1],
    [16, 9],
    [9, 16],
    [4, 3],
    [3, 4],
  ];
  return ratios[Math.floor(Math.random() * ratios.length)];
};

const generateItems = (count: number, start: number): FeedItem[] =>
  Array.from({ length: count }).map((_, i) => {
    const [w, h] = randRatio();
    const width = 200;
    const height = Math.round((width / w) * h);
    return {
      id: `item-${i + start}`,
      width,
      height,
      src: `https://picsum.photos/${width}/${height}?random=${i + start}`,
    };
  });

export default function MasonryDemo() {
  const [items, setItems] = useState(() => generateItems(20, 0));

  const loadMore = () => {
    setItems((p) => [...p, ...generateItems(20, p.length)]);
  };

  return (
    <>
      <div style={{ height: "80vh", overflowY: "auto", padding: 8 }}>
        <MasonryInfiniteGrid
          gap={8}
          useRecycle={true} // 核心：开启 DOM recycling
          virtual={true} // 虚拟化
        >
          {items.map((item) => (
            <div
              key={item.id}
              data-grid-width={item.width}
              data-grid-height={item.height}
              style={{ width: item.width, height: item.height }}
            >
              <img
                src={item.src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </MasonryInfiniteGrid>
      </div>

      <button onClick={loadMore} style={{ marginTop: 10 }}>
        Load more
      </button>
    </>
  );
}

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Collection } from "react-virtualized";
import { ImageItem, fetchImages } from "./types";
import "react-virtualized/styles.css";

interface MasonryProps {
  /** 列数 */
  columnCount?: number;
  /** 列间距 */
  columnGutter?: number;
  /** 行间距 */
  rowGutter?: number;
  /** 容器宽度 */
  width?: number;
  /** 容器高度 */
  height?: number;
  /** 每次加载的数量 */
  itemsPerLoad?: number;
  /** 触底加载的阈值（距离底部多少像素时触发） */
  threshold?: number;
}

interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ColumnHeights {
  [key: number]: number;
}

export const Masonry2: React.FC<MasonryProps> = ({
  columnCount = 3,
  columnGutter = 10,
  rowGutter = 10,
  width = 1200,
  height = 800,
  itemsPerLoad = 20,
  threshold = 200,
}) => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [imageHeights, setImageHeights] = useState<{ [key: number]: number }>(
    {}
  );
  const [scrollTop, setScrollTop] = useState(0);
  const collectionRef = useRef<Collection>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 图片基础宽度（根据列数和间距计算）
  const cellWidth = useMemo(() => {
    return (width - (columnCount - 1) * columnGutter) / columnCount;
  }, [width, columnCount, columnGutter]);

  // 计算每个单元格的位置
  const cellPositionGetter = useCallback(
    (params: { index: number }): CellPosition => {
      const { index } = params;
      const item = items[index];
      if (!item) {
        return { x: 0, y: 0, width: cellWidth, height: 200 };
      }

      // 获取图片高度，如果还没加载则使用估算值
      const itemHeight = imageHeights[item.id] || cellWidth / item.aspectRatio;

      // 计算应该放在哪一列（选择当前高度最小的列）
      const columnHeights: ColumnHeights = {};
      for (let i = 0; i < columnCount; i++) {
        columnHeights[i] = 0;
      }

      // 计算之前所有元素的位置，确定每列的当前高度
      for (let i = 0; i < index; i++) {
        const prevItem = items[i];
        if (!prevItem) continue;

        const prevHeight =
          imageHeights[prevItem.id] || cellWidth / prevItem.aspectRatio;

        // 找到高度最小的列
        let minColumn = 0;
        let minHeight = columnHeights[0];
        for (let j = 1; j < columnCount; j++) {
          if (columnHeights[j] < minHeight) {
            minHeight = columnHeights[j];
            minColumn = j;
          }
        }

        // 更新该列的高度
        columnHeights[minColumn] += prevHeight + rowGutter;
      }

      // 为当前元素找到高度最小的列
      let minColumn = 0;
      let minHeight = columnHeights[0];
      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < minHeight) {
          minHeight = columnHeights[i];
          minColumn = i;
        }
      }

      return {
        x: minColumn * (cellWidth + columnGutter),
        y: minHeight,
        width: cellWidth,
        height: itemHeight,
      };
    },
    [items, imageHeights, cellWidth, columnCount, columnGutter, rowGutter]
  );

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (items.length === 0) return 0;

    const columnHeights: number[] = new Array(columnCount).fill(0);

    items.forEach((item) => {
      const itemHeight = imageHeights[item.id] || cellWidth / item.aspectRatio;

      // 找到高度最小的列
      let minColumn = 0;
      let minHeight = columnHeights[0];
      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < minHeight) {
          minHeight = columnHeights[i];
          minColumn = i;
        }
      }

      // 更新该列的高度
      columnHeights[minColumn] += itemHeight + rowGutter;
    });

    return Math.max(...columnHeights);
  }, [items, imageHeights, cellWidth, columnCount, rowGutter]);

  // 加载更多数据
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const startIndex = items.length;
      const stopIndex = startIndex + itemsPerLoad - 1;
      const newImages = await fetchImages(startIndex, stopIndex);

      if (newImages.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => [...prev, ...newImages]);
        // 新数据加载后，重新计算布局
        setTimeout(() => {
          if (collectionRef.current) {
            collectionRef.current.recomputeCellSizesAndPositions();
          }
        }, 0);
      }
    } catch (error) {
      console.error("加载图片失败:", error);
    } finally {
      setLoading(false);
    }
  }, [items.length, loading, hasMore, itemsPerLoad]);

  // 初始加载
  useEffect(() => {
    loadMore();
  }, []);

  // 处理图片加载完成，更新高度
  const handleImageLoad = useCallback(
    (itemId: number, img: HTMLImageElement) => {
      const actualHeight = (img.naturalHeight / img.naturalWidth) * cellWidth;

      setImageHeights((prev) => {
        if (Math.abs(prev[itemId] - actualHeight) < 1) return prev; // 避免微小差异导致重新渲染
        return { ...prev, [itemId]: actualHeight };
      });

      // 图片加载后，通知 Collection 重新计算布局
      if (collectionRef.current) {
        collectionRef.current.recomputeCellSizesAndPositions();
      }
    },
    [cellWidth]
  );

  // 触底检测和滚动同步
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const currentScrollTop = container.scrollTop;
      setScrollTop(currentScrollTop);

      if (loading || !hasMore) return;

      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // 检查是否接近底部
      if (scrollHeight - currentScrollTop - clientHeight < threshold) {
        loadMore();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [loading, hasMore, threshold, loadMore]);

  // 渲染单元格
  const cellRenderer = useCallback(
    ({
      index,
      key,
      style,
    }: {
      index: number;
      key: number;
      style: React.CSSProperties;
    }) => {
      const item = items[index];
      if (!item) return null;

      return (
        <div key={key} style={style}>
          <div
            style={{
              width: "100%",
              height: "100%",
              padding: `${rowGutter / 2}px ${columnGutter / 2}px`,
            }}
          >
            <img
              src={item.src}
              alt={`Image ${item.id}`}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "4px",
                objectFit: "cover",
              }}
              onLoad={(e) => {
                handleImageLoad(item.id, e.currentTarget);
              }}
              loading="lazy"
            />
          </div>
        </div>
      );
    },
    [items, rowGutter, columnGutter, handleImageLoad]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        overflow: "auto",
        position: "relative",
      }}
    >
      <Collection
        ref={collectionRef}
        cellCount={items.length}
        cellRenderer={cellRenderer}
        cellSizeAndPositionGetter={cellPositionGetter}
        height={totalHeight}
        width={width}
        scrollTop={scrollTop}
        scrollLeft={0}
        autoHeight={false}
      />
      {loading && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            borderRadius: "4px",
          }}
        >
          加载中...
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            borderRadius: "4px",
          }}
        >
          没有更多了
        </div>
      )}
    </div>
  );
};

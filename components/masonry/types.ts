// src/types.ts

/** 定义瀑布流图片的数据结构 */
export interface ImageItem {
  id: number;
  src: string;
  aspectRatio: number; // 宽度/高度
}

// --- 模拟数据和API ---
const ITEMS_PER_LOAD = 20;
const TOTAL_ITEMS = 100; // 模拟总数据量

/**
 * 模拟一个异步API调用，返回一组包含随机尺寸图片的URL
 * @param startIndex - 开始索引
 * @param stopIndex - 结束索引
 * @returns Promise<ImageItem[]>
 */
export const fetchImages = (startIndex: number, stopIndex: number): Promise<ImageItem[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newImages: ImageItem[] = [];
      for (let i = startIndex; i <= stopIndex; i++) {
        if (i >= TOTAL_ITEMS) {
            break; // 超过总数，停止生成
        }
        // 随机生成一个比例 (0.5 到 2.0)，模拟横屏、竖屏、正方
        const aspectRatio = 0.5 + Math.random() * 1.5;
        // 使用占位符服务生成对应比例的图片
        const width = 300;
        const height = Math.round(width / aspectRatio);
        const src = `https://picsum.photos/${width}/${height}?random=${i}`;
        
        newImages.push({
          id: i,
          src: src,
          aspectRatio: aspectRatio
        });
      }
      resolve(newImages);
    }, 500); // 模拟网络延迟
  });
};
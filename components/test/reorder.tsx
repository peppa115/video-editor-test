'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useRef } from 'react'

interface Clip {
  id: string
  start: number
  duration: number
}

function ClipItem({ id, start, duration, onResize }: Clip & { onResize: (id: string, delta: number, side: 'left' | 'right') => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    // transform: CSS.Transform.toString(transform),
    transform: transform
    ? `translate(${transform.x}px, ${transform.y}px) scale(1)`
    : undefined,
    transition,
    // left: `${start}px`,
    // left: isDragging ? undefined : `${start}px`,
    width: `${duration}px`,
    
  }

  // 拉伸事件处理
  const handleMouseDown = (side: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      onResize(id, delta, side)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // className="absolute top-0 h-8 bg-blue-500 rounded cursor-grab"
      className=" h-8 bg-blue-500 rounded cursor-grab"
      style={style}
    >
      <div
        onMouseDown={(e) => handleMouseDown('left', e)}
        className="absolute left-0 top-0 w-1 h-full cursor-ew-resize bg-white/50"
      />
      <div
        onMouseDown={(e) => handleMouseDown('right', e)}
        className="absolute right-0 top-0 w-1 h-full cursor-ew-resize bg-white/50"
      />
      <span className="text-xs text-white p-2 select-none">Clip {id}</span>
    </div>
  )
}

export default function Timeline() {
  const [clips, setClips] = useState<Clip[]>([
    { id: '1', start: 0, duration: 150 },
    { id: '2', start: 160, duration: 80 },
    { id: '3', start: 260, duration: 50 },
  ])

  const handleResize = (id: string, delta: number, side: 'left' | 'right') => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        if (side === 'left') {
          return { ...c, start: c.start + delta, duration: c.duration - delta }
        } else {
          return { ...c, duration: c.duration + delta }
        }
      })
    )
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        console.log("%c Line:84 🍰 onDragEnd", "color:#f5ce50",  active, over );

        if (!over) return
        if (active.id !== over.id) {
          setClips((prev) => {
            const oldIndex = prev.findIndex(c => c.id === active.id)
            const newIndex = prev.findIndex(c => c.id === over.id)
            const newOrder = arrayMove(prev, oldIndex, newIndex)

            // 再根据顺序更新 start
            let currentStart = 0
            return newOrder.map(c => {
              const updated = { ...c, start: currentStart }
              currentStart += c.duration + 2 // 假设 2px 间隙
              return updated
            })
          })
        }
      }}
    >
      <SortableContext items={clips.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex relative h-10 w-full bg-gray-800">
          {clips.map((clip) => (
            <ClipItem key={clip.id} {...clip} onResize={handleResize} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

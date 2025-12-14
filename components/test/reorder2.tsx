'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  DragMoveEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Clip {
  id: string
  start: number
  duration: number
}

interface ClipItemProps extends Clip {
  onResize: (id: string, delta: number, side: 'left' | 'right') => void
}

function ClipItem({ id, start, duration, onResize }: ClipItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  // 拖拽过程中保持 scale=1
  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px) scale(1)`
      : undefined,
    transition,
    width: `${duration}px`,
    left: isDragging ? undefined : `${start}px`,
    position: 'absolute',
  }

  // 拉伸逻辑
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
      className="absolute top-0 h-12 bg-blue-500 rounded cursor-grab flex items-center justify-center text-white text-sm select-none"
      style={style}
    >
      <div
        onMouseDown={(e) => handleMouseDown('left', e)}
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-white/50"
      />
      <div
        onMouseDown={(e) => handleMouseDown('right', e)}
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-white/50"
      />
      Clip {id}
    </div>
  )
}

export default function TimelineNew() {
  const [clips, setClips] = useState<Clip[]>([
    { id: '1', start: 0, duration: 200 },
    { id: '2', start: 220, duration: 100 },
    { id: '3', start: 330, duration: 80 },
  ])

  const [insertIndex, setInsertIndex] = useState<number | null>(null)

  const handleResize = (id: string, delta: number, side: 'left' | 'right') => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        if (side === 'left') {
          const newStart = c.start + delta
          const newDuration = c.duration - delta
          return { ...c, start: newStart < 0 ? 0 : newStart, duration: newDuration < 10 ? 10 : newDuration }
        } else {
          const newDuration = c.duration + delta
          return { ...c, duration: newDuration < 10 ? 10 : newDuration }
        }
      })
    )
  }

  // 计算插入线位置
  const calculateInsertX = (index: number) => {
    if (index === 0) return 0
    let left = 0
    for (let i = 0; i < index; i++) {
      left += clips[i].duration + 2
    }
    return left
  }

  return (
    <div className="w-full h-24 p-4 bg-gray-900 relative">
      <DndContext
        collisionDetection={closestCenter}
        onDragMove={(event: DragMoveEvent) => {
          const activeId = event.active.id
          const activeClip = clips.find(c => c.id === activeId)
          const mouseX = activeClip ? event.delta.x + activeClip.start : 0
          let newIndex = clips.findIndex(
            c => mouseX < c.start + c.duration / 2
          )
          if (newIndex === -1) newIndex = clips.length
          setInsertIndex(newIndex)
        }}
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event
          if (!over || active.id === over.id) {
            setInsertIndex(null)
            return
          }
          setClips(prev => {
            const oldIndex = prev.findIndex(c => c.id === active.id)
            const newIndex = prev.findIndex(c => c.id === over.id)
            let newOrder = arrayMove(prev, oldIndex, newIndex)

            // 更新 start
            let currentStart = 0
            newOrder = newOrder.map(c => {
              const updated = { ...c, start: currentStart }
              currentStart += c.duration + 2
              return updated
            })
            return newOrder
          })
          setInsertIndex(null)
        }}
      >
        <SortableContext items={clips.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="relative h-full w-full">
            {clips.map(c => (
              <ClipItem key={c.id} {...c} onResize={handleResize} />
            ))}

            {insertIndex !== null && (
              <div
                className="absolute w-[2px] bg-red-500 h-full top-0"
                style={{ left: calculateInsertX(insertIndex) }}
              />
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp, Columns3, GripVertical, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ResolvedColumn } from "@/hooks/use-table-layout"
import { cn } from "@/lib/utils"

function move<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// Show/hide and reorder a table's columns. Drag a row, or use the arrows
// (which also work from the keyboard).
export function ColumnsMenu({
  layout,
  onChange,
  onReset,
  isCustomised,
}: {
  layout: ResolvedColumn[]
  onChange: (next: ResolvedColumn[]) => void
  onReset: () => void
  isCustomised: boolean
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const visibleCount = layout.filter((column) => column.visible).length

  const toggle = (index: number, visible: boolean) =>
    onChange(layout.map((column, i) => (i === index ? { ...column, visible } : column)))

  const endDrag = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="border-white/10 bg-background/60">
          <Columns3 className="mr-2 h-4 w-4" />
          Columns
          {visibleCount < layout.length && (
            <span className="ml-2 rounded bg-white/10 px-1.5 text-xs text-muted-foreground">
              {visibleCount}/{layout.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-white/5 px-3 py-2.5">
          <p className="text-sm font-medium">Columns</p>
          <p className="text-xs text-muted-foreground">Drag to reorder. Saved to your account.</p>
        </div>
        <ul className="max-h-[360px] overflow-y-auto p-1.5">
          {layout.map((column, index) => (
            <li
              key={column.id}
              draggable
              onDragStart={(event) => {
                setDragIndex(index)
                event.dataTransfer.effectAllowed = "move"
              }}
              onDragOver={(event) => {
                if (dragIndex === null) return
                event.preventDefault()
                setOverIndex(index)
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (dragIndex !== null && dragIndex !== index) onChange(move(layout, dragIndex, index))
                endDrag()
              }}
              onDragEnd={endDrag}
              className={cn(
                "group flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-white/[0.04]",
                dragIndex === index && "opacity-40",
                overIndex === index && dragIndex !== index && "ring-1 ring-emerald-500/50",
              )}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/60 active:cursor-grabbing" />
              <Checkbox
                id={`column-${column.id}`}
                checked={column.visible}
                disabled={column.required}
                onCheckedChange={(value) => toggle(index, !!value)}
              />
              <label
                htmlFor={`column-${column.id}`}
                className={cn("flex-1 select-none", column.required ? "text-muted-foreground" : "cursor-pointer")}
              >
                {column.label}
                {column.required && <span className="ml-1 text-xs">(always shown)</span>}
              </label>
              <div className="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => onChange(move(layout, index, index - 1))}
                  aria-label={`Move ${column.label} up`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={index === layout.length - 1}
                  onClick={() => onChange(move(layout, index, index + 1))}
                  aria-label={`Move ${column.label} down`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/5 p-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            disabled={!isCustomised}
            onClick={onReset}
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset to default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

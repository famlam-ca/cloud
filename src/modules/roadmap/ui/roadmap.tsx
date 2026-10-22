"use client"

import { cn } from "cn"
import * as React from "react"

import { Badge, badgeVariants } from "@/components/ui/badge"
import type { RoadmapCategory } from "@/modules/roadmap/data/roadmap"
import { roadmap } from "@/modules/roadmap/data/roadmap"

type ItemStatus = RoadmapCategory["items"][0]["status"]

export function Roadmap() {
  const [isDragging, setIsDragging] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef({ isDragging: false, scrollLeft: 0, startX: 0 })

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const element = scrollRef.current
    const target = event.target as HTMLElement

    if (
      !element ||
      target.closest("[data-roadmap-card], [data-roadmap-item]")
    ) {
      return
    }

    event.preventDefault()
    setIsDragging(true)
    dragRef.current = {
      isDragging: true,
      scrollLeft: element.scrollLeft,
      startX: event.clientX,
    }
    element.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = scrollRef.current
    const drag = dragRef.current
    if (!element || !drag.isDragging) return

    element.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX)
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current.isDragging = false
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-hidden",
        isDragging && "select-none",
      )}
      onPointerCancel={stopDragging}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      ref={scrollRef}
    >
      <div className="grid h-full auto-cols-max grid-flow-col items-start gap-4 pb-4 lg:gap-8">
        {roadmap.map((cat) => (
          <div
            className="flex max-h-[calc(100%-1rem)] min-h-0 w-[min(24rem,calc(100dvw-2rem))] flex-col border bg-card p-6 shadow-sm backdrop-blur-sm"
            data-roadmap-card
            key={cat.category}
          >
            <h2 className="mb-6 flex items-center justify-between border-b pb-3 font-semibold text-xl">
              {cat.category}
              <Badge className="px-1.5" variant="secondary">
                {cat.items.length}
              </Badge>
            </h2>

            <div className="-mr-4 flex-1 overflow-y-auto overflow-x-hidden">
              <ul className="space-y-4 pr-4">
                {cat.items.map((item, idx) => (
                  <li
                    className="group relative flex flex-col border border-muted/50 bg-input/30 p-3 shadow-sm transition-colors hover:border-muted dark:bg-muted"
                    data-roadmap-item
                    key={idx}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "font-medium text-sm leading-relaxed",
                          item.status === "completed"
                            ? "text-muted-foreground line-through"
                            : "text-foreground",
                        )}
                      >
                        {item.title.split("`").map((text, i) =>
                          i % 2 === 1 ? (
                            <code
                              className="-mx-1 bg-muted px-1.5 py-0.5 font-bold font-mono text-xs dark:bg-input/30"
                              key={i}
                            >
                              {text}
                            </code>
                          ) : (
                            text
                          ),
                        )}
                      </span>
                      <StatusBadge status={item.status as ItemStatus} />
                    </div>

                    {item.note && (
                      <p className="mt-2 border border-dashed bg-muted p-2 text-foreground/70 text-xs italic dark:bg-background/75">
                        {item.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const variant: Record<ItemStatus, string> = {
    completed: badgeVariants({ variant: "success" }),
    "in-progress": badgeVariants({ variant: "warning" }),
    todo: badgeVariants({ variant: "outline" }),
  }

  const labels: Record<ItemStatus, string> = {
    completed: "Done",
    "in-progress": "In Progress",
    todo: "Backlog",
  }

  return <Badge className={variant[status]}>{labels[status]}</Badge>
}

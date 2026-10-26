import * as React from "react"
import { cn } from "cn"
import { Dialog as SheetPrimitive } from "radix-ui"

import { Button } from "@workspace/ui/components/button"
import { Ellipsis, EllipsisVertical, XIcon } from "lucide-react"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  resizable = true,
  style,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  resizable?: boolean
}) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef<{
    pointerId: number
    startX: number
    startY: number
    startSize: number
  } | null>(null)
  const [size, setSize] = React.useState<number | null>(null)
  const [isResizing, setIsResizing] = React.useState(false)
  const isHorizontalResize = side === "left" || side === "right"

  const clampSize = (value: number) => {
    const viewportSize = isHorizontalResize
      ? window.innerWidth
      : window.innerHeight
    return Math.min(
      Math.max(value, Math.min(240, viewportSize * 0.9)),
      viewportSize * 0.9
    )
  }

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !panelRef.current) return
    event.preventDefault()
    const rect = panelRef.current.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startSize: isHorizontalResize ? rect.width : rect.height,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsResizing(true)
  }

  const moveResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const delta = isHorizontalResize
      ? event.clientX - drag.startX
      : event.clientY - drag.startY
    const growsToward = side === "left" || side === "top" ? delta : -delta
    setSize(clampSize(drag.startSize + growsToward))
  }

  const stopResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsResizing(false)
  }

  const resizeWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const panel = panelRef.current
    if (!panel) return
    const rect = panel.getBoundingClientRect()
    const currentSize = size ?? (isHorizontalResize ? rect.width : rect.height)
    const increaseKey =
      side === "right"
        ? "ArrowLeft"
        : side === "left"
          ? "ArrowRight"
          : side === "top"
            ? "ArrowDown"
            : "ArrowUp"
    const decreaseKey =
      side === "right"
        ? "ArrowRight"
        : side === "left"
          ? "ArrowLeft"
          : side === "top"
            ? "ArrowUp"
            : "ArrowDown"
    const step = event.shiftKey ? 40 : 16

    if (event.key === increaseKey) {
      event.preventDefault()
      setSize(clampSize(currentSize + step))
    } else if (event.key === decreaseKey) {
      event.preventDefault()
      setSize(clampSize(currentSize - step))
    }
  }

  const resizeHandlePosition = {
    right: "absolute inset-y-0 left-0",
    left: "absolute inset-y-0 right-0",
    top: "absolute inset-x-0 bottom-0",
    bottom: "absolute inset-x-0 top-0",
  }[side]
  const resizeHandleClassName = `group/resize ${resizeHandlePosition} z-20 flex shrink-0 touch-none justify-center outline-none ${isHorizontalResize ? "w-1 cursor-col-resize before:inset-y-2 before:left-1/2 before:w-1 before:-translate-x-1/2" : "h-1 cursor-row-resize before:inset-x-2 before:top-1/2 before:h-1 before:-translate-y-1/2"} before:absolute before:rounded-lg before:content-[''] ${isResizing ? "before:bg-primary" : "hover:before:bg-primary focus-visible:before:bg-primary"} before:delay-200 before:duration-200`
  const viewportSize =
    typeof window === "undefined"
      ? undefined
      : isHorizontalResize
        ? window.innerWidth
        : window.innerHeight

  const resizedStyle: React.CSSProperties = {
    ...style,
    ...(size !== null && isHorizontalResize
      ? { width: size, minWidth: "min(240px, 90vw)", maxWidth: "90vw" }
      : {}),
    ...(size !== null && !isHorizontalResize
      ? { height: size, minHeight: "min(240px, 90vh)", maxHeight: "90vh" }
      : {}),
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={panelRef}
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          `fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg ${isResizing ? "transition-none" : "transition duration-200 ease-in-out"} data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10`,
          className
        )}
        style={resizedStyle}
        {...props}
      >
        {children}
        {resizable && (
          <div
            data-slot="sheet-resize-handle"
            role="separator"
            aria-label={`Resize sheet from ${side} side`}
            aria-orientation={isHorizontalResize ? "vertical" : "horizontal"}
            aria-valuemin={
              viewportSize === undefined
                ? undefined
                : Math.min(240, viewportSize * 0.9)
            }
            aria-valuemax={
              viewportSize === undefined ? undefined : viewportSize * 0.9
            }
            aria-valuenow={size ?? undefined}
            tabIndex={0}
            onFocus={() => {
              if (size === null && panelRef.current) {
                const rect = panelRef.current.getBoundingClientRect()
                setSize(isHorizontalResize ? rect.width : rect.height)
              }
            }}
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            onLostPointerCapture={() => {
              dragRef.current = null
              setIsResizing(false)
            }}
            onKeyDown={resizeWithKeyboard}
            className={resizeHandleClassName}
          >
            <span className="self-center text-border">
              {isHorizontalResize ? (
                <EllipsisVertical aria-hidden="true" className="size-4" />
              ) : (
                <Ellipsis aria-hidden="true" className="size-4" />
              )}
            </span>
          </div>
        )}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3 right-3"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

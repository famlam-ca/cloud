"use client"

import { cn } from "cn"
import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useControllableState } from "@/hooks/use-controllable"
import type { Breakpoint } from "@/hooks/use-media-query"
import { useIsBreakpoint } from "@/hooks/use-media-query"

type Variant = "default" | "alert"

interface ResponsiveDialogContextValue {
  isMobile: boolean
  variant: Variant
  close: () => void
}

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextValue | null>(null)

function useResponsiveDialogContext(
  component: string,
): ResponsiveDialogContextValue {
  const ctx = React.useContext(ResponsiveDialogContext)
  if (!ctx) {
    throw new Error(`<${component}> must be used within <ResponsiveDialog>`)
  }
  return ctx
}

interface ResponsiveDialogProps
  extends Omit<React.ComponentProps<typeof Dialog>, "children">,
    Pick<
      React.ComponentProps<typeof Drawer>,
      "showSwipeHandle" | "snapPoints" | "swipeDirection"
    > {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  breakpoint?: Breakpoint | number
  variant?: Variant
}

function ResponsiveDialog({
  breakpoint = "md",
  variant = "default",
  swipeDirection,
  snapPoints,
  showSwipeHandle,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ResponsiveDialogProps) {
  const isMobile = useIsBreakpoint(breakpoint)
  const [open, setOpen] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: openProp,
  })
  const close = React.useCallback(() => setOpen(false), [setOpen])

  const Root = (
    isMobile ? Drawer : variant === "alert" ? AlertDialog : Dialog
  ) as React.ElementType

  const mobileProps = isMobile
    ? {
        showSwipeHandle,
        snapPoints,
        swipeDirection,
        ...(variant === "alert" ? { disablePointerDismissal: true } : {}),
      }
    : {}

  return (
    <ResponsiveDialogContext.Provider value={{ close, isMobile, variant }}>
      <Root
        data-slot="responsive-dialog"
        onOpenChange={setOpen}
        open={open}
        {...mobileProps}
        {...props}
      >
        {children}
      </Root>
    </ResponsiveDialogContext.Provider>
  )
}

type TriggerProps = React.ComponentProps<typeof AlertDialogTrigger> &
  React.ComponentProps<typeof DialogTrigger> &
  React.ComponentProps<typeof DrawerTrigger>

function ResponsiveDialogTrigger(props: TriggerProps) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogTrigger",
  )
  const Trigger = isMobile
    ? DrawerTrigger
    : variant === "alert"
      ? AlertDialogTrigger
      : DialogTrigger
  return <Trigger data-slot="responsive-dialog-trigger" {...props} />
}

type CloseProps = React.ComponentProps<typeof DialogClose> &
  React.ComponentProps<typeof DrawerClose>

function ResponsiveDialogClose(props: CloseProps) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogClose",
  )
  if (!isMobile && variant === "alert") {
    throw new Error(
      "ResponsiveDialogClose cannot be used in an alert-variant ResponsiveDialog - use ResponsiveDialogCancel or ResponsiveDialogAction instead.",
    )
  }
  const Close = isMobile ? DrawerClose : DialogClose
  return <Close data-slot="responsive-dialog-close" {...props} />
}

function ResponsiveDialogCancel(props: CloseProps) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogCancel",
  )
  if (isMobile) {
    return <DrawerClose data-slot="responsive-dialog-cancel" {...props} />
  }
  const Cancel = variant === "alert" ? AlertDialogCancel : DialogClose
  return <Cancel data-slot="responsive-dialog-cancel" {...props} />
}

type ActionProps = React.ComponentProps<typeof Button>

function ResponsiveDialogAction({ onClick, ...props }: ActionProps) {
  const { close, isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogAction",
  )
  if (!isMobile && variant === "alert") {
    return (
      <AlertDialogAction
        data-slot="responsive-dialog-action"
        onClick={onClick}
        {...(props as React.ComponentProps<typeof AlertDialogAction>)}
      />
    )
  }
  return (
    <Button
      data-slot="responsive-dialog-action"
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) close()
      }}
      {...props}
    />
  )
}

const CONTENT_SIZE_CLASSNAME = {
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-[calc(100%-2rem)]",
  lg: "sm:max-w-lg",
  md: "sm:max-w-md",
  sm: "sm:max-w-sm",
  xl: "sm:max-w-xl",
} as const

type ContentSize = keyof typeof CONTENT_SIZE_CLASSNAME

interface ResponsiveDialogContentProps {
  className?: string
  children: React.ReactNode
  size?: ContentSize
  alertDialogProps?: Omit<
    React.ComponentProps<typeof AlertDialogContent>,
    "className" | "children" | "size"
  >
  dialogProps?: Omit<
    React.ComponentProps<typeof DialogContent>,
    "children" | "className"
  >
  drawerProps?: Omit<
    React.ComponentProps<typeof DrawerContent>,
    "children" | "className"
  >
}

function ResponsiveDialogContent({
  className,
  children,
  size = "md",
  alertDialogProps,
  dialogProps,
  drawerProps,
}: ResponsiveDialogContentProps) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogContent",
  )

  if (isMobile) {
    return (
      <DrawerContent
        className={className}
        data-slot="responsive-dialog-content"
        {...drawerProps}
      >
        {children}
      </DrawerContent>
    )
  }

  if (variant === "alert") {
    return (
      <AlertDialogContent
        className={cn(CONTENT_SIZE_CLASSNAME[size], className)}
        data-slot="responsive-dialog-content"
        size="auto"
        {...alertDialogProps}
      >
        {children}
      </AlertDialogContent>
    )
  }

  return (
    <DialogContent
      className={cn(CONTENT_SIZE_CLASSNAME[size], className)}
      data-slot="responsive-dialog-content"
      {...dialogProps}
    >
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogHeader",
  )
  const Header = isMobile
    ? DrawerHeader
    : variant === "alert"
      ? AlertDialogHeader
      : DialogHeader
  return (
    <Header
      className={className}
      data-slot="responsive-dialog-header"
      {...props}
    />
  )
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogFooter",
  )
  const Footer = isMobile
    ? DrawerFooter
    : variant === "alert"
      ? AlertDialogFooter
      : DialogFooter
  return (
    <Footer
      className={className}
      data-slot="responsive-dialog-footer"
      {...props}
    />
  )
}

function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof AlertDialogTitle> &
    React.ComponentProps<typeof DialogTitle> &
    React.ComponentProps<typeof DrawerTitle>,
) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogTitle",
  )
  const Title = isMobile
    ? DrawerTitle
    : variant === "alert"
      ? AlertDialogTitle
      : DialogTitle
  return <Title data-slot="responsive-dialog-title" {...props} />
}

function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof AlertDialogDescription> &
    React.ComponentProps<typeof DialogDescription> &
    React.ComponentProps<typeof DrawerDescription>,
) {
  const { isMobile, variant } = useResponsiveDialogContext(
    "ResponsiveDialogDescription",
  )
  const Description = isMobile
    ? DrawerDescription
    : variant === "alert"
      ? AlertDialogDescription
      : DialogDescription
  return <Description data-slot="responsive-dialog-description" {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogAction,
  ResponsiveDialogCancel,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}

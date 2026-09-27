"use client"

import {
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconNetwork,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconPower,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react"
import { notFound, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Hint } from "@/components/hint"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import {
  cn,
  getInstanceStatusAnimation,
  getInstanceStatusColor,
} from "@/lib/utils"
import { IPAddress } from "@/modules/dashboard/ui/ip-addres"
import type {
  Instance,
  InstancePowerActionEnum,
  InstanceStatusEnum,
} from "@/schemas/instance"

const TRANSITIONAL_STATUSES: InstanceStatusEnum[] = [
  "queued",
  "provisioning",
  "starting",
  "stopping",
  "restarting",
  "pending_deletion",
  "deleting",
]

function InstanceActions({ instance }: { instance: Instance }) {
  const router = useRouter()
  const utils = api.useUtils()
  const { copyToClipboard } = useCopyToClipboard()

  const startMutation = api.instance.start.useMutation({
    onError(error) {
      console.error("Error starting instance:", error)
      toast.error("Failed to start instance.", {
        description: error.message,
      })
    },
    onSuccess(data) {
      void utils.instance.get.invalidate({ id: data.id })
      void utils.activity.list.invalidate({
        instanceId: data.id,
        scope: "instance",
      })
    },
  })
  const rebootMutation = api.instance.reboot.useMutation({
    onError(error) {
      console.error("Error rebooting instance:", error)
      toast.error("Failed to reboot instance.", {
        description: error.message,
      })
    },
    onSuccess(data) {
      void utils.instance.get.invalidate({ id: data.id })
      void utils.activity.list.invalidate({
        instanceId: data.id,
        scope: "instance",
      })
    },
  })
  const shutdownMutation = api.instance.shutdown.useMutation({
    onError(error) {
      console.error("Error shutting down instance:", error)
      toast.error("Failed to shut down instance.", {
        description: error.message,
      })
    },
    onSuccess(data) {
      void utils.instance.get.invalidate({ id: data.id })
      void utils.activity.list.invalidate({
        instanceId: data.id,
        scope: "instance",
      })
    },
  })
  const stopMutation = api.instance.stop.useMutation({
    onError(error) {
      console.error("Error stopping instance:", error)
      toast.error("Failed to stop instance.", {
        description: error.message,
      })
    },
    onSuccess(data) {
      void utils.instance.get.invalidate({ id: data.id })
      void utils.activity.list.invalidate({
        instanceId: data.id,
        scope: "instance",
      })
    },
  })
  const deleteMutation = api.instance.delete.useMutation({
    onError(error) {
      console.error("Error deleting instance:", error)
      toast.error("Failed to delete instance.", {
        description: error.message,
      })
    },
    onSuccess(data) {
      router.push("/instance/list")
      void utils.instance.get.invalidate({ id: data.instanceId })
      void utils.activity.list.invalidate({
        instanceId: data.instanceId,
        scope: "instance",
      })
    },
  })

  const isTransitionalStatus = TRANSITIONAL_STATUSES.includes(instance.status)

  function isDisabled(action: InstancePowerActionEnum) {
    switch (action) {
      case "start":
        return instance.status !== "stopped"
      case "reboot":
        return instance.status !== "running"
      case "shutdown":
        return instance.status !== "running"
      case "stop":
        return instance.status === "stopped"
      default:
        return true
    }
  }

  const isDeletable =
    instance.status !== "provisioning" &&
    instance.status !== "pending_deletion" &&
    instance.status !== "deleting" &&
    instance.status !== "deleted"

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          Actions <IconChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Power Actions</DropdownMenuLabel>
            <DropdownMenuItem
              disabled={isDisabled("start") || isTransitionalStatus}
              onClick={() => startMutation.mutate({ id: instance.id })}
            >
              <IconPlayerPlayFilled /> Start
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isDisabled("reboot") || isTransitionalStatus}
              onClick={() => rebootMutation.mutate({ id: instance.id })}
            >
              <IconRefresh /> Restart
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isDisabled("shutdown") || isTransitionalStatus}
              onClick={() => shutdownMutation.mutate({ id: instance.id })}
            >
              <IconPower /> Shutdown
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20 *:[svg]:text-destructive"
              disabled={isDisabled("stop")}
              onClick={() => stopMutation.mutate({ id: instance.id })}
            >
              <IconPlayerStopFilled /> Stop
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Instance Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => copyToClipboard(instance.id)}>
              <IconCopy /> Copy ID
            </DropdownMenuItem>
            <AlertDialogTrigger
              nativeButton={false}
              render={
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20 *:[svg]:text-destructive"
                  disabled={!isDeletable}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onSelect={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <IconTrash /> Delete
                </DropdownMenuItem>
              }
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <IconTrash />
          </AlertDialogMedia>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Confirming will permanently delete the
            instance <strong>{instance.hostname}</strong> and all of its data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            variant="outline"
          >
            Keep Instance
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!isDeletable || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: instance.id })}
            variant="destructive"
          >
            {deleteMutation.isPending && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function InstanceDetailsInfo({ instanceId }: { instanceId: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const { data: instance } = api.instance.get.useQuery(
    { id: instanceId },
    {
      refetchInterval(query) {
        const status = query.state.data?.status
        if (!status) return false
        return TRANSITIONAL_STATUSES.includes(status) ? 2000 : false
      },
    },
  )

  if (!instance) return notFound()

  return (
    <div className="mb-1 flex h-auto flex-col gap-4 md:h-20 md:flex-row md:items-center md:justify-between md:gap-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <Hint label={`Instance: ${instance.status}`} side="bottom">
            <div
              className={cn(
                "mt-1 size-3 rounded-full",
                getInstanceStatusColor(instance.status),
                getInstanceStatusAnimation(instance.status),
              )}
            />
          </Hint>
          <h1 className="peer/hostname font-medium text-2xl underline decoration-muted-foreground decoration-dotted underline-offset-4">
            {instance.hostname}
          </h1>
          <Button
            className="w-auto opacity-0 hover:opacity-100 peer-hover/hostname:opacity-100"
            onClick={() => copyToClipboard(instance.hostname)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                copyToClipboard(instance.hostname)
              }
            }}
            size="icon"
            variant="ghost"
          >
            {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
            <span className="sr-only">Copy to clipboard</span>
          </Button>
        </div>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-5">
            {instance.ipAllocations.map((allocation) => (
              <IPAddress ipAddress={allocation.ipAddress} key={allocation.id} />
            ))}
            <Button
              className="gap-1.5 px-0"
              // TODO
              onClick={() => alert("Coming soon!")}
              size="sm"
              variant="link"
            >
              <IconNetwork /> Add IP Address
            </Button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <InstanceActions instance={instance} />
    </div>
  )
}

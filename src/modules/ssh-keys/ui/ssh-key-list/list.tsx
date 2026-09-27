"use client"

import {
  IconCopy,
  IconKeyFilled,
  IconPointFilled,
  IconSparkles2,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react"
import { formatDistanceToNowStrict } from "date-fns"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import type { SSHKey } from "@/schemas/ssh-key"

import { GenerateSSHKeyModal } from "./generate-ssh-key-modal"
import { ImportSSHKeyModal } from "./import-ssh-key-modal"

export function SshKeysList({ new: newParam }: { new?: string }) {
  const router = useRouter()

  const [sshKeys] = api.sshKey.list.useSuspenseQuery()

  const [openModal, setOpenModal] = React.useState<
    "generate" | "import" | null
  >(newParam === "generate" || newParam === "import" ? newParam : null)

  React.useEffect(() => {
    if (newParam !== "generate" && newParam !== "import") return
    setOpenModal(newParam)
    const url = new URL(window.location.href)
    if (!url.searchParams.has("new")) return
    url.searchParams.delete("new")
    router.replace(`${url.pathname}${url.search}${url.hash}` as Route, {
      scroll: false,
    })
  }, [newParam, router])

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <CardTitle>SSH keys</CardTitle>
          <CardDescription>
            Use SSH keys to securely connect to your instances.
          </CardDescription>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ImportSSHKeyModal
            onOpenChange={(open) => setOpenModal(open ? "import" : null)}
            open={openModal === "import"}
            render={<Button size="sm" variant="outline" />}
          >
            <IconUpload /> Import key
          </ImportSSHKeyModal>
          <GenerateSSHKeyModal
            onOpenChange={(open) => setOpenModal(open ? "generate" : null)}
            open={openModal === "generate"}
            render={<Button size="sm" />}
          >
            <IconSparkles2 /> Generate key
          </GenerateSSHKeyModal>
        </div>
      </CardHeader>
      <CardContent>
        {sshKeys.length === 0 ? (
          <Empty className="mt-4 border bg-muted/20 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconKeyFilled className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Add your first SSH key</EmptyTitle>
              <EmptyDescription>
                SSH keys let you connect to your instances without sharing a
                password. Generate a new key or import one you already use.
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex justify-center gap-2">
              <GenerateSSHKeyModal
                onOpenChange={(open) => setOpenModal(open ? "generate" : null)}
                open={openModal === "generate"}
                render={<Button size="sm" />}
              >
                <IconSparkles2 /> Generate key
              </GenerateSSHKeyModal>
              <ImportSSHKeyModal
                onOpenChange={(open) => setOpenModal(open ? "import" : null)}
                open={openModal === "import"}
                render={<Button size="sm" variant="outline" />}
              >
                <IconUpload /> Import key
              </ImportSSHKeyModal>
            </div>
          </Empty>
        ) : (
          <div className="mt-4 divide-y overflow-hidden rounded-xl">
            {sshKeys.map((key) => (
              <SshKeyRow key={key.id} sshKey={key} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SshKeyRow({ sshKey }: { sshKey: SSHKey }) {
  const utils = api.useUtils()
  const { copyToClipboard } = useCopyToClipboard()
  const [open, setOpen] = React.useState(false)

  const deleteKey = api.sshKey.delete.useMutation({
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(`Deleted "${sshKey.name}"`)
      void utils.sshKey.list.invalidate()
    },
  })

  function copyPublicKey() {
    copyToClipboard(sshKey.publicKey)
    toast.success("Public key copied")
  }

  function copyFingerprint() {
    copyToClipboard(sshKey.fingerprint)
    toast.success("Fingerprint copied")
  }

  return (
    <div className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 bg-card p-4 transition-colors hover:bg-muted/30 xl:grid-cols-[minmax(11rem,0.8fr)_minmax(0,1.2fr)_auto] xl:items-center">
      <Item size="sm">
        <ItemContent>
          <div className="flex items-center gap-2">
            <ItemTitle>{sshKey.name}</ItemTitle>
            <Badge className="uppercase" variant="secondary">
              {sshKey.type}
            </Badge>
            <span
              className="shrink-0 whitespace-nowrap text-muted-foreground text-xs"
              suppressHydrationWarning
            >
              Added{" "}
              {sshKey.createdAt
                ? formatDistanceToNowStrict(new Date(sshKey.createdAt), {
                    addSuffix: true,
                  })
                : "—"}
            </span>
          </div>
          <ItemDescription className="flex flex-wrap items-center gap-x-1 truncate font-mono text-xs">
            {sshKey.comment ?? "No comment"}
          </ItemDescription>
        </ItemContent>
      </Item>

      <div className="col-span-full row-start-2 grid gap-1 rounded-xl border bg-muted/20 p-1 xl:col-span-1 xl:row-start-auto xl:grid-cols-2">
        <div className="flex items-center gap-2 overflow-hidden rounded-lg bg-background/60 px-2 py-1">
          <span className="shrink-0 text-muted-foreground text-xs">
            Fingerprint
          </span>
          <span className="flex-1 truncate font-mono text-muted-foreground text-xs">
            {sshKey.fingerprint}
          </span>
          <Button
            aria-label="Copy fingerprint"
            onClick={copyFingerprint}
            size="icon-xs"
            title="Copy fingerprint"
            type="button"
            variant="ghost"
          >
            <IconCopy />
          </Button>
        </div>
        <div className="flex items-center gap-2 overflow-hidden rounded-lg bg-background/60 px-2 py-1">
          <span className="shrink-0 text-muted-foreground text-xs">
            Public key
          </span>
          <span className="flex-1 truncate font-mono text-muted-foreground text-xs">
            {sshKey.publicKey}
          </span>
          <Button
            aria-label="Copy public key"
            onClick={copyPublicKey}
            size="icon-xs"
            title="Copy public key"
            type="button"
            variant="ghost"
          >
            <IconCopy />
          </Button>
        </div>
      </div>

      <div className="col-start-2 row-start-1 flex justify-self-end xl:col-start-auto xl:row-start-auto">
        <Button
          aria-label="Delete SSH key"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
          disabled={deleteKey.isPending}
          onClick={() => setOpen(true)}
          size="icon"
          title="Delete SSH key"
          type="button"
          variant="ghost"
        >
          <IconTrash />
        </Button>

        <AlertDialog onOpenChange={setOpen} open={open}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                <IconTrash />
              </AlertDialogMedia>
              <AlertDialogTitle>
                Delete &quot;{sshKey.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Any instance using this key for authentication will need a
                different key configured, or it may become inaccessible. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteKey.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteKey.isPending}
                onClick={() => deleteKey.mutate({ id: sshKey.id })}
                variant="destructive"
              >
                {deleteKey.isPending && <Spinner />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

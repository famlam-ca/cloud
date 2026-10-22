"use client"

import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconTerminal,
} from "@tabler/icons-react"
import { notFound } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useRevealOnClick } from "@/hooks/use-reveal-on-click"
import { api } from "@/lib/api/client"

export function InstanceAccessConnection({
  instanceId,
}: {
  instanceId: string
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()
  const { handleReveal, getDisplayText } = useRevealOnClick()

  const { data: instance } = api.instance.get.useQuery({ id: instanceId })
  const { data: instanceSSHKeys } = api.instance.getSSHKeys.useQuery({
    id: instanceId,
  })

  if (!instance) return notFound()

  // TODO: handle multiple ssh keys, and IPs
  const keyName = instanceSSHKeys?.[0]?.name || "id_rsa"
  const ipAddress = instance.ipAllocations[0]?.ipAddress

  const connectionString = `ssh -i ~/.ssh/id_${keyName} cloud-user@${ipAddress}`
  const sshUrl = `ssh://cloud-user@${ipAddress}`

  const isDisabled = instance.status !== "running" || !instanceSSHKeys?.length

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="font-medium text-muted-foreground text-sm">
          Connect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 border bg-background px-3 py-3">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
            <span className="text-muted-foreground">ssh -i</span>{" "}
            <span className="text-amber-500">~/.ssh/id_{keyName}</span>
            <span className="text-primary"> cloud-user@</span>
            <button
              className="cursor-pointer"
              onClick={handleReveal}
              type="button"
            >
              {getDisplayText(ipAddress)}
            </button>
          </code>

          <Button
            aria-label="Copy connection command"
            className="text-muted-foreground"
            onClick={() => copyToClipboard(connectionString)}
            size="icon-xs"
            variant="ghost"
          >
            {isCopied ? (
              <IconCheck className="size-3.5 text-green-500" />
            ) : (
              <IconCopy className="size-3.5" />
            )}
            <span className="sr-only">Copy connection command</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={isDisabled}
            nativeButton={isDisabled}
            render={
              isDisabled ? undefined : (
                <a href={sshUrl} rel="noopener noreferrer" target="_blank">
                  <span className="sr-only">Open in SSH client</span>
                </a>
              )
            }
          >
            <IconTerminal /> Open in SSH client
          </Button>
          <span className="text-muted-foreground text-xs">
            Opens your system&apos;s default client, if one is registered
          </span>
        </div>

        <Alert variant="warning">
          <IconAlertTriangle />
          <AlertTitle className="text-foreground/70! text-sm">
            Before connecting from the command line
          </AlertTitle>
          <AlertDescription className="w-full text-foreground/60! text-xs">
            Your key file needs owner-only permissions, or OpenSSH will refuse
            it:{" "}
            <span className="bg-yellow-500/15 p-1 font-mono">
              chmod 600 ~/.ssh/id_{keyName}
            </span>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

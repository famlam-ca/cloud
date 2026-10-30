"use client"

import { IconCheck, IconCopy } from "@tabler/icons-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import { IPAddress } from "@/modules/dashboard/ui/ip-addres"

export function InstanceAccessDetails({ instanceId }: { instanceId: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const { data: instance } = api.instance.get.useQuery({ id: instanceId })

  const { data: instanceSSHKeys } = api.instance.getSSHKeys.useQuery({
    id: instanceId,
  })

  if (!instance) return notFound()

  // TODO: correctly handle multiple ssh keys, and IPs
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-semibold">
          Details
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 *:not-last:border-b">
        <div className="grid h-8 grid-cols-2 items-center gap-4 md:grid-cols-4">
          <p className="text-muted-foreground">Host</p>
          <div className="col-span-1 md:col-span-3">
            {instance.ipAllocations.map((allocation) => (
              <IPAddress
                direction="rtl"
                ipAddress={allocation.ipAddress}
                key={allocation.id}
                showGlobe={false}
              />
            ))}
          </div>
        </div>
        <div className="grid h-8 grid-cols-2 items-center gap-4 md:grid-cols-4">
          <p className="text-muted-foreground">User</p>
          <div className="col-span-1 flex items-center gap-2 md:col-span-3">
            <Badge className="bg-primary/20 text-primary text-sm">
              cloud-user
            </Badge>
            <Button
              className="text-muted-foreground"
              onClick={() => copyToClipboard("cloud-user")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  copyToClipboard("cloud-user")
                }
              }}
              size="icon-sm"
              variant="ghost"
            >
              {isCopied ? (
                <IconCheck className="text-green-500" />
              ) : (
                <IconCopy />
              )}
              <span className="sr-only">Copy to clipboard</span>
            </Button>
          </div>
        </div>
        <div className="grid h-8 grid-cols-2 items-center gap-4 md:grid-cols-4">
          <p className="text-muted-foreground">Port</p>
          <p className="col-span-1 font-mono text-sm md:col-span-3">22</p>
        </div>
        <div className="grid h-8 grid-cols-2 items-center gap-4 md:grid-cols-4">
          <p className="text-muted-foreground">SSH key</p>
          <div className="col-span-1 space-y-1 md:col-span-3">
            {instanceSSHKeys?.map((key) => (
              <p className="font-mono text-sm" key={key.id}>
                {key.name}{" "}
                <span className="text-muted-foreground">({key.type})</span>
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

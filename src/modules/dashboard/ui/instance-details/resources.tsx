"use client"

import { CpuIcon, HardDriveIcon, MemoryStickIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { api } from "@/lib/api/client"

export function InstanceResources({ instanceId }: { instanceId: string }) {
  const { data: instance } = api.instance.get.useQuery({ id: instanceId })

  if (!instance) return notFound()

  const RESOURCES = [
    { icon: CpuIcon, label: "vCPUs", value: instance.cores.toString() },
    {
      icon: MemoryStickIcon,
      label: "RAM",
      value: `${(instance.memory / 1024).toFixed(1)} GB`,
    },
    { icon: HardDriveIcon, label: "Disk", value: `${instance.disk} GB` },
  ]

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-4">
        {RESOURCES.map((resource, index) => {
          const Icon = resource.icon

          return (
            <Item className="items-center md:w-auto" key={index}>
              <ItemMedia variant="icon">
                <Icon className="size-6 stroke-primary" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-2xl">{resource.value}</ItemTitle>
                <ItemDescription className="text-base text-foreground">
                  {resource.label}
                </ItemDescription>
              </ItemContent>
            </Item>
          )
        })}
      </CardContent>
      {/* <CardFooter className="border-t">
        <Button
          className="border-dashed text-muted-foreground"
          // TODO
          onClick={() => alert("Coming soon!")}
          size="xs"
          variant="outline"
        >
          Add labels
        </Button>
      </CardFooter> */}
    </Card>
  )
}

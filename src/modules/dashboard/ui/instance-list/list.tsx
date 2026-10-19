"use client"

import { IconCirclePlus, IconServer2 } from "@tabler/icons-react"
import Link from "next/link"

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
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api } from "@/lib/api/client"
import { organizationPath } from "@/lib/organization-path"

import { columns } from "./columns"
import { InstanceTable } from "./table"

export function InstanceList({ slug }: { slug: string }) {
  const [instances, query] = api.instance.list.useSuspenseInfiniteQuery(
    { limit: DEFAULT_PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  )

  const instanceData = instances.pages.flatMap((page) => page.items)

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <CardTitle>Instances</CardTitle>
          <CardDescription>Your virtual machine instances.</CardDescription>
        </div>
        <Button
          nativeButton={false}
          render={<Link href={organizationPath(slug, "instances/create")} />}
          size="sm"
        >
          <IconCirclePlus /> New Instance
        </Button>
      </CardHeader>
      <CardContent>
        {instanceData.length === 0 ? (
          <Empty className="mt-4 border bg-muted/20 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconServer2 className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Add your first instance</EmptyTitle>
              <EmptyDescription>
                Instances are virtual machines that you can use to run your
                applications. Create a new instance to get started.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              nativeButton={false}
              render={
                <Link href={organizationPath(slug, "instances/create")} />
              }
              size="sm"
            >
              <IconCirclePlus /> New Instance
            </Button>
          </Empty>
        ) : (
          <InstanceTable
            columns={columns}
            data={instanceData}
            fetchNextPage={query.fetchNextPage}
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
          />
        )}
      </CardContent>
    </Card>
  )
}

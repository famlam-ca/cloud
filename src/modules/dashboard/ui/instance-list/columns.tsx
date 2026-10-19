"use client"

import {
  IconAdjustmentsHorizontal,
  IconCopy,
  IconDots,
  IconListDetails,
} from "@tabler/icons-react"
import { createColumnHelper } from "@tanstack/react-table"
import { formatDate, formatDistanceToNowStrict } from "date-fns"
import { CpuIcon, HardDriveIcon, MemoryStickIcon } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"

import { DataTableColumnHeader } from "@/components/data-table/column-header"
import type { DataTableFeatures } from "@/components/data-table/features"
import { Hint } from "@/components/hint"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CLOUD_LOCATIONS } from "@/constants/app"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  cn,
  getInstanceStatusAnimation,
  getInstanceStatusColor,
} from "@/lib/utils"
import { IPAddress } from "@/modules/dashboard/ui/ip-addres"
import type { Instance } from "@/schemas/instance"

const columnHelper = createColumnHelper<DataTableFeatures, Instance>()

function ActionsCell({ instance }: { instance: Instance }) {
  const { copyToClipboard } = useCopyToClipboard()

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="icon" variant="ghost" />}>
          <IconDots className="size-6 stroke-muted-foreground" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              render={<Link href={`./${instance.id}` as Route} />}
            >
              <IconListDetails /> View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => copyToClipboard(instance.id)}>
              <IconCopy /> Copy ID
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const columns = columnHelper.columns([
  columnHelper.display({
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllRowsSelected()}
        indeterminate={
          table.getIsSomeRowsSelected() && !table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
      />
    ),
    id: "select",
  }),
  columnHelper.accessor("hostname", {
    cell({ row }) {
      const { id, hostname, status, cores, memory, disk } = row.original

      return (
        <div className="flex items-center gap-4">
          <Hint label={`Instance: ${status}`} side="bottom">
            <div
              className={cn(
                "mt-1 size-3 rounded-full",
                getInstanceStatusColor(status),
                getInstanceStatusAnimation(status),
              )}
            />
          </Hint>
          <Link href={`./${id}` as Route}>
            <p className="font-medium text-base text-primary">{hostname}</p>
            <p className="text-sm">
              <CpuIcon className="inline-block size-3.5 stroke-foreground/70" />{" "}
              {cores} vCPUs |{" "}
              <MemoryStickIcon className="inline-block size-3.5 stroke-foreground/70" />{" "}
              {(memory / 1024).toFixed(1)} GB |{" "}
              <HardDriveIcon className="inline-block size-3.5 stroke-foreground/70" />{" "}
              {disk} GB
            </p>
          </Link>
        </div>
      )
    },
    header: () => <div>Name</div>,
  }),
  columnHelper.accessor("ipAllocations.ipAddress", {
    cell({ row }) {
      const primaryIpAllocation = row.original.ipAllocations.find(
        (allocation) => allocation.isPrimary,
      )
      const ipAddress = primaryIpAllocation?.ipAddress

      return ipAddress ? <IPAddress ipAddress={ipAddress} /> : "N/A"
    },
    header: () => <div>IP Address</div>,
  }),
  columnHelper.display({
    cell() {
      return <div>🇨🇦 {CLOUD_LOCATIONS.at(0)?.region}</div>
    },
    header: () => <div>Location</div>,
    id: "location",
  }),
  columnHelper.accessor("createdAt", {
    cell({ row }) {
      const date = new Date(row.getValue("createdAt"))
      const formattedDate = formatDistanceToNowStrict(date, { addSuffix: true })
      return (
        <Hint
          label={formatDate(new Date(date), "PPpp")}
          side="top"
          sideOffset={8}
        >
          {formattedDate}
        </Hint>
      )
    },
    enableHiding: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
  }),
  columnHelper.display({
    cell({ row }) {
      return <ActionsCell instance={row.original} />
    },
    header: () => (
      <div className="flex justify-end">
        <IconAdjustmentsHorizontal className="size-4" />
      </div>
    ),
    id: "actions",
  }),
])

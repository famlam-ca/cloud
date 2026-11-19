"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconTrash } from "@tabler/icons-react"
import type { Organization } from "better-auth/plugins"
import { cn } from "cn"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import { deleteOrganizationSchema } from "@/schemas/organization"

type OrganizationSummary = Pick<Organization, "id">

interface DeleteOrgFormProps {
  onOpenChange?: (open: boolean) => void
  org: OrganizationSummary
}

export function DeleteOrgForm({ onOpenChange, org }: DeleteOrgFormProps) {
  const router = useRouter()
  const utils = api.useUtils()

  const form = useForm<z.infer<typeof deleteOrganizationSchema>>({
    defaultValues: {
      id: org.id,
    },
    resolver: zodResolver(deleteOrganizationSchema),
  })

  const deleteOrganization = api.organization.delete.useMutation({
    onError(error) {
      toast.error("Failed to delete organization:", {
        description: error.message,
      })
    },
    async onSuccess() {
      form.reset()
      onOpenChange?.(false)

      await utils.organization.list.invalidate()

      router.refresh()
    },
  })

  const isDisabled = form.formState.isSubmitting || deleteOrganization.isPending

  function onSubmit(data: z.infer<typeof deleteOrganizationSchema>) {
    if (isDisabled || data === org) return
    deleteOrganization.mutate(data)
  }

  return (
    <form
      className="mt-4 space-y-4 md:mt-0"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        control={form.control}
        name="id"
        render={({ field }) => (
          <input {...field} type="hidden" value={field.value} />
        )}
      />

      <div className="flex items-center justify-end gap-2">
        <ResponsiveDialogClose
          render={
            <Button disabled={isDisabled} type="button" variant="outline">
              Cancel
            </Button>
          }
        />
        <Button disabled={isDisabled} type="submit" variant="destructive">
          {deleteOrganization.isPending && <Spinner />}
          Delete <span className="hidden md:inline">Organization</span>
        </Button>
      </div>
    </form>
  )
}

interface DeleteOrgModalProps {
  children?: React.ReactNode
  className?: string
  onOpenChange?: (open: boolean) => void
  open?: boolean
  org: OrganizationSummary
  render?: React.ReactElement
  showTrigger?: boolean
}

export function DeleteOrgModal({
  children,
  className,
  onOpenChange,
  open,
  org,
  render,
  showTrigger = true,
}: DeleteOrgModalProps) {
  function handleOpenChange(next: boolean) {
    onOpenChange?.(next)
  }

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      {showTrigger && (
        <ResponsiveDialogTrigger
          className={cn(className)}
          onClick={() => onOpenChange?.(true)}
          render={render || <Button size="sm" variant="ghost" />}
        >
          {children ? (
            children
          ) : (
            <>
              <span className="flex items-center justify-center size-5 rounded bg-sidebar-primary text-sidebar-primary-foreground">
                <IconTrash />
              </span>
              <p className="text-sm text-muted-foreground">
                Delete Organization
              </p>
            </>
          )}
        </ResponsiveDialogTrigger>
      )}
      <ResponsiveDialogContent className="max-md:h-1/2 mb-8 md:mb-0" size="xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Delete Organization</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Are you sure you want to delete this organization?
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 pb-8 md:p-0">
          <DeleteOrgForm onOpenChange={onOpenChange} org={org} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

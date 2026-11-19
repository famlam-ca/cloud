"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconDeviceFloppy } from "@tabler/icons-react"
import type { Organization } from "better-auth/plugins"
import { cn } from "cn"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
import { updateOrganizationSchema } from "@/schemas/organization"

type OrganizationSummary = Pick<Organization, "id" | "name" | "logo">

interface UpdateOrgFormProps {
  onOpenChange?: (open: boolean) => void
  org: OrganizationSummary
}

export function UpdateOrgForm({ onOpenChange, org }: UpdateOrgFormProps) {
  const router = useRouter()
  const utils = api.useUtils()

  const form = useForm<z.infer<typeof updateOrganizationSchema>>({
    defaultValues: {
      id: org.id,
      logo: org.logo || "",
      name: org.name,
    },
    resolver: zodResolver(updateOrganizationSchema),
  })

  const updateOrganization = api.organization.update.useMutation({
    onError(error) {
      toast.error("Failed to update organization:", {
        description: error.message,
      })
    },
    async onSuccess(data) {
      form.reset()
      onOpenChange?.(false)

      await Promise.all([
        utils.organization.list.invalidate(),
        utils.organization.get.invalidate({ slug: data.slug }),
      ])

      router.refresh()
    },
  })

  const isDisabled = form.formState.isSubmitting || updateOrganization.isPending

  function onSubmit(data: z.infer<typeof updateOrganizationSchema>) {
    if (isDisabled || data === org) return
    updateOrganization.mutate(data)
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
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              id={field.name}
              placeholder="Organization Name"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="logo"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Logo URL</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                {field.value ? (
                  <img
                    alt="Logo preview"
                    className="size-8 rounded object-cover"
                    src={field.value}
                  />
                ) : (
                  <span className="size-8 flex items-center justify-center rounded bg-muted">
                    <Icons.logo className="size-6" />
                  </span>
                )}
              </InputGroupAddon>
              <InputGroupInput
                {...field}
                aria-invalid={fieldState.invalid}
                id={field.name}
                placeholder="https://example.com/logo.png"
                value={field.value ?? ""}
              />
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
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
        <Button disabled={isDisabled} type="submit">
          {updateOrganization.isPending && <Spinner />}
          Update <span className="hidden md:inline">Organization</span>
        </Button>
      </div>
    </form>
  )
}

interface UpdateOrgModalProps {
  children?: React.ReactNode
  className?: string
  onOpenChange?: (open: boolean) => void
  open?: boolean
  org: OrganizationSummary
  render?: React.ReactElement
  showTrigger?: boolean
}

export function UpdateOrgModal({
  children,
  className,
  onOpenChange,
  open,
  org,
  render,
  showTrigger = true,
}: UpdateOrgModalProps) {
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
                <IconDeviceFloppy />
              </span>
              <p className="text-sm text-muted-foreground">
                Update Organization
              </p>
            </>
          )}
        </ResponsiveDialogTrigger>
      )}
      <ResponsiveDialogContent className="max-md:h-1/2" size="xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Update Organization</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update the organization name and logo. Changes will be reflected
            across the platform.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 pb-8 md:p-0">
          <UpdateOrgForm onOpenChange={onOpenChange} org={org} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

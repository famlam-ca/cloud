"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconPlus } from "@tabler/icons-react"
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
import { authClient } from "@/lib/auth/client"
import { createOrganizationSchema } from "@/schemas/organization"

interface CreateOrgFormProps {
  onOpenChange?: (open: boolean) => void
}

export function CreateOrgForm({ onOpenChange }: CreateOrgFormProps) {
  const router = useRouter()
  const utils = api.useUtils()

  const form = useForm<z.infer<typeof createOrganizationSchema>>({
    defaultValues: {
      logo: "",
      name: "",
    },
    resolver: zodResolver(createOrganizationSchema),
  })

  const createOrganization = api.organization.create.useMutation({
    onError(error) {
      toast.error("Failed to create organization:", {
        description: error.message,
      })
    },
    async onSuccess(data) {
      form.reset()
      onOpenChange?.(false)

      const { error } = await authClient.organization.setActive({
        fetchOptions: { cache: "no-store" },
        organizationSlug: data.slug,
      })

      if (error) {
        toast.error("Failed to set active organization:", {
          description: error.message,
        })
      }

      await Promise.all([
        utils.organization.list.invalidate(),
        utils.organization.get.invalidate({ slug: data.slug }),
      ])

      router.refresh()
      router.push(`/orgs/${data.slug}`)
    },
  })

  const isDisabled = form.formState.isSubmitting || createOrganization.isPending

  function onSubmit(data: z.infer<typeof createOrganizationSchema>) {
    if (isDisabled) return
    createOrganization.mutate(data)
  }

  return (
    <form
      className="mt-4 space-y-4 md:mt-0"
      onSubmit={form.handleSubmit(onSubmit)}
    >
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
          {createOrganization.isPending && <Spinner />}
          Create <span className="hidden md:inline">Organization</span>
        </Button>
      </div>
    </form>
  )
}

interface CreateOrgModalProps {
  children?: React.ReactNode
  className?: string
  onOpenChange?: (open: boolean) => void
  open?: boolean
  render?: React.ReactElement
  showTrigger?: boolean
}

export function CreateOrgModal({
  children,
  className,
  onOpenChange,
  open,
  render,
  showTrigger = true,
}: CreateOrgModalProps) {
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
                <IconPlus />
              </span>
              <p className="text-sm text-muted-foreground">
                Create Organization
              </p>
            </>
          )}
        </ResponsiveDialogTrigger>
      )}
      <ResponsiveDialogContent className="max-md:h-1/2 mb-8 md:mb-0" size="xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create Organization</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Create a new organization to manage your projects and resources.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 pb-8 md:p-0">
          <CreateOrgForm onOpenChange={onOpenChange} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

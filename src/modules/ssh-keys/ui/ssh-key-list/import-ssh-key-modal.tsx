"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconUpload } from "@tabler/icons-react"
import type * as React from "react"
import { Controller, useForm } from "react-hook-form"
import type * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { importSSHKeySchema } from "@/schemas/ssh-key"

export function ImportSSHKeyModal({
  onOpenChange,
  open,
  render,
  children,
  className,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  render?: React.ReactElement
  children?: React.ReactNode
  className?: string
}) {
  const utils = api.useUtils()

  const form = useForm<z.infer<typeof importSSHKeySchema>>({
    defaultValues: {
      comment: "",
      name: "",
      publicKey: "",
    },
    resolver: zodResolver(importSSHKeySchema),
  })

  const importKey = api.sshKey.import.useMutation({
    onError: (error) => {
      form.setError("root", { message: error.message })
    },
    onSuccess: () => {
      void utils.sshKey.list.invalidate()
      form.reset()
      handleOpenChange(false)
    },
  })

  const isDisabled = form.formState.isSubmitting || importKey.isPending

  function onSubmit(data: z.infer<typeof importSSHKeySchema>) {
    if (isDisabled) return
    importKey.mutate(data)
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) form.reset()
  }

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogTrigger
        className={cn(className)}
        render={
          render || (
            <Button
              className="hover:bg-transparent! hover:text-foreground! hover:no-underline"
              disabled={isDisabled}
              size="sm"
              type="button"
              variant="link"
            />
          )
        }
      >
        {children ? (
          children
        ) : (
          <>
            <IconUpload /> Import key
          </>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent
        className="max-h-[calc(100dvh-1rem)] max-md:h-full"
        size="lg"
      >
        <ResponsiveDialogHeader className="px-0 pb-4 text-left!">
          <ResponsiveDialogTitle>Import SSH key</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Paste an existing public key. Ed25519 and RSA (2048-bit minimum) are
            supported.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="no-scrollbar overflow-y-auto md:max-h-[50dvh]">
          <form
            className="mt-4 space-y-4 md:mt-0"
            id="import-ssh-key-form"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    <div className="relative">
                      Name
                      <span className="absolute top-0 -right-2 text-destructive text-xs">
                        *
                      </span>
                    </div>
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    disabled={isDisabled}
                    id={field.name}
                    placeholder="e.g. work_laptop"
                    type="text"
                  />
                  <FieldDescription>
                    A descriptive name for your SSH key pair. This will help you
                    identify it later.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="publicKey"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    <div className="relative">
                      Public key
                      <span className="absolute top-0 -right-2 text-destructive text-xs">
                        *
                      </span>
                    </div>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="min-h-25 resize-none font-mono text-xs"
                    disabled={isDisabled}
                    id={field.name}
                    placeholder="ssh-ed25519 AAAA..."
                    value={field.value ?? ""}
                  />
                  <FieldDescription>
                    Paste your existing public key here. Ed25519 and RSA
                    (2048-bit minimum) are supported.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="comment"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Comment</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="min-h-25 resize-none"
                    disabled={isDisabled}
                    id={field.name}
                    placeholder="Optional comment for your SSH key"
                    value={field.value ?? ""}
                  />
                  <FieldDescription>
                    An optional comment for your SSH key pair. This can be used
                    to provide additional context or information about the key.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </p>
            )}
          </form>
        </div>
        <ResponsiveDialogFooter className="flex-row justify-end max-md:pt-4">
          <Button
            disabled={importKey.isPending}
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={importKey.isPending}
            form="import-ssh-key-form"
            type="submit"
          >
            {importKey.isPending ? <Spinner /> : <IconUpload />}
            Import
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

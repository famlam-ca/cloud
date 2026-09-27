"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconAlertCircleFilled,
  IconCheck,
  IconCopy,
  IconDownload,
  IconSparkles2,
} from "@tabler/icons-react"
import JSZip from "jszip"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { SSHKey } from "@/schemas/ssh-key"
import { generateSSHKeySchema } from "@/schemas/ssh-key"
import { sshKeyTypeEnum } from "@/server/db/schema"

export function GenerateSSHKeyModal({
  onOpenChange,
  open,
  render,
  children,
  className,
}: {
  onOpenChange?: (open: boolean) => void
  open?: boolean
  render?: React.ReactElement
  children?: React.ReactNode
  className?: string
}) {
  const utils = api.useUtils()
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const [downloaded, setDownloaded] = React.useState(false)
  const [sshKey, setSSHKey] = React.useState<
    (SSHKey & { privateKey: string }) | null
  >(null)

  const form = useForm<
    z.input<typeof generateSSHKeySchema>,
    unknown,
    z.output<typeof generateSSHKeySchema>
  >({
    defaultValues: {
      comment: "",
      name: "",
      type: "ed25519",
    },
    resolver: zodResolver(generateSSHKeySchema),
  })

  const generateSSHKey = api.sshKey.generate.useMutation({
    onError(error) {
      toast.error("Failed to generate SSH key:", {
        description: error.message,
        position: "top-center",
      })
    },
    onSuccess(data) {
      setSSHKey(data)
      form.reset()
      void utils.sshKey.list.invalidate()
      void utils.activity.list.invalidate()
    },
  })

  const isDisabled = form.formState.isSubmitting || generateSSHKey.isPending

  function onSubmit(data: z.infer<typeof generateSSHKeySchema>) {
    if (isDisabled) return
    generateSSHKey.mutate(data)
  }

  function handleCopyPrivateKey() {
    copyToClipboard(sshKey?.privateKey || "")
  }

  function handleDownloadKey(
    privateKey: string,
    publicKey: string,
    keyName: string,
  ) {
    const slug = keyName.toLowerCase().replace(/\s/g, "_")
    const zip = new JSZip()
    zip.file(`id_${slug}`, privateKey)
    zip.file(`id_${slug}.pub`, publicKey)
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = `id_${slug}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    setDownloaded(true)
  }

  return (
    <ResponsiveDialog
      onOpenChange={(open) => {
        onOpenChange?.(open)
        if (!open) {
          setSSHKey(null)
          setDownloaded(false)
        }
      }}
      open={open}
      variant="alert"
    >
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
            <IconSparkles2 /> Generate key
          </>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent
        className="max-h-[calc(100dvh-1rem)] max-md:h-full"
        size="xl"
      >
        {sshKey ? (
          <>
            <ResponsiveDialogHeader className="px-0 pb-4 text-left!">
              <ResponsiveDialogTitle>
                SSH Key Pair generated Successfully
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Please download your SSH key pair and store it securely.
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            <Alert variant="warning">
              <IconAlertCircleFilled />
              <AlertTitle className="font-semibold">Important:</AlertTitle>
              <AlertDescription>
                For security reasons, this is the <strong>only</strong> time you
                will be able to view or download your private key. Make sure to
                store it safely.
              </AlertDescription>
            </Alert>

            <div className="mt-4 flex flex-col gap-4">
              <div>
                <Label className="mb-2 block font-medium">Private Key:</Label>
                <InputGroup>
                  <InputGroupTextarea
                    className="wrap-break-word field-sizing-fixed max-h-48 resize-none font-mono md:max-h-24"
                    readOnly
                    rows={6}
                    value={sshKey.privateKey}
                  />
                  <InputGroupAddon align="inline-end" className="items-start">
                    <InputGroupButton
                      className="ml-auto text-foreground"
                      onClick={handleCopyPrivateKey}
                      size="icon-xs"
                      type="button"
                    >
                      {isCopied ? (
                        <IconCheck className="text-green-500" />
                      ) : (
                        <IconCopy />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <ResponsiveDialogFooter className="flex-row justify-end">
                {downloaded && (
                  <Button
                    onClick={() => setSSHKey(null)}
                    type="button"
                    variant="secondary"
                  >
                    Close
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleDownloadKey(
                      sshKey.privateKey,
                      sshKey.publicKey,
                      sshKey.name,
                    )
                  }}
                  type="button"
                >
                  <IconDownload />
                  Download Key
                </Button>
              </ResponsiveDialogFooter>
            </div>
          </>
        ) : (
          <>
            <ResponsiveDialogHeader className="px-0 pb-4 text-left!">
              <ResponsiveDialogTitle>
                Generate New SSH Key Pair
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Generate a new SSH key pair for secure access to your computes.
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <div className="no-scrollbar overflow-y-auto md:max-h-[50dvh]">
              <form
                className="mt-4 space-y-4 md:mt-0"
                id="generate-ssh-key-form"
                onSubmit={(e) => {
                  e.stopPropagation()
                  form.handleSubmit(onSubmit)(e)
                }}
              >
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field, fieldState }) => (
                    <FieldSet className="gap-3">
                      <FieldLegend className="relative" variant="label">
                        Key type
                        <span className="absolute top-0 -right-2 text-destructive text-xs">
                          *
                        </span>
                      </FieldLegend>
                      <FieldDescription>
                        Choose the algorithm used to secure your connection.
                      </FieldDescription>
                      <RadioGroup
                        aria-label="SSH key type"
                        className="grid gap-3 sm:grid-cols-2"
                        name={field.name}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        {sshKeyTypeEnum.enumValues.map((type) => (
                          <FieldLabel
                            className="cursor-pointer hover:has-data-checked:bg-primary/10!"
                            htmlFor={`ssh-key-type-${type}`}
                            key={type}
                          >
                            <Field
                              data-invalid={fieldState.invalid}
                              orientation="horizontal"
                            >
                              <FieldContent className="gap-1">
                                <FieldTitle className="uppercase tracking-wide">
                                  {type}
                                </FieldTitle>
                                <FieldDescription>
                                  {type === "ed25519"
                                    ? "Modern, fast, and recommended"
                                    : "Broad compatibility with older systems"}
                                </FieldDescription>
                              </FieldContent>
                              <RadioGroupItem
                                aria-invalid={fieldState.invalid}
                                id={`ssh-key-type-${type}`}
                                value={type}
                              />
                            </Field>
                          </FieldLabel>
                        ))}
                      </RadioGroup>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldSet>
                  )}
                />
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
                        A descriptive name for your SSH key pair. This will help
                        you identify it later.
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
                        An optional comment for your SSH key pair. This can be
                        used to provide additional context or information about
                        the key.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </form>
            </div>
            <ResponsiveDialogFooter className="flex-row justify-end max-md:pt-4">
              <Button
                disabled={isDisabled}
                onClick={() => onOpenChange?.(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isDisabled}
                form="generate-ssh-key-form"
                type="submit"
              >
                {generateSSHKey.isPending ? <Spinner /> : <IconSparkles2 />}
                Generate
              </Button>
            </ResponsiveDialogFooter>
          </>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

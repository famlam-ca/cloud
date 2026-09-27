"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconArrowLeft,
  IconArrowNarrowLeft,
  IconArrowRight,
  IconCirclePlus,
  IconEdit,
  IconKey,
  IconRefreshAlert,
  IconServer,
  IconShieldCheck,
  IconSparkles2,
  IconUpload,
} from "@tabler/icons-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api/client"
import {
  cn,
  getOperatingSystemCategoryIcon,
  getOperatingSystemFamilyIcon,
  getOperatingSystemStatusColor,
  getResourcePlanIcon,
  getResourcePlanStatusColor,
} from "@/lib/utils"
import {
  basicInfoSchema,
  operatingSystemSchema,
  refinedCreateInstanceSchema,
  resourcePlanSchema,
} from "@/schemas/instance"
import type { SSHKey } from "@/schemas/ssh-key"

type BasicInfo = z.infer<typeof basicInfoSchema>
type OperatingSystemInfo = z.infer<typeof operatingSystemSchema>
type ResourcePlanInfo = z.infer<typeof resourcePlanSchema>
type ReviewAndCreateInfo = z.infer<typeof refinedCreateInstanceSchema>

type FormData = {
  basics?: BasicInfo
  operatingSystem?: OperatingSystemInfo
  resources?: ResourcePlanInfo
}

function BasicInfoForm({
  defaultValues,
  onNext,
}: {
  defaultValues?: BasicInfo
  onNext: (d: BasicInfo) => void
}) {
  const form = useForm<BasicInfo>({
    defaultValues: defaultValues || {
      hostname: "",
      sshKeyId: "",
    },
    resolver: zodResolver(basicInfoSchema),
  })

  const { data: sshKeys } = api.sshKey.list.useQuery()

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when defaultValues changes
  React.useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues])

  return (
    <form className="space-y-8" onSubmit={form.handleSubmit(onNext)}>
      <FieldGroup className="flex flex-col gap-4 md:flex-row">
        <Controller
          control={form.control}
          name="hostname"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Hostname</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id={field.name}
                placeholder="web-server-01"
                type="text"
              />
              <FieldDescription>
                Use a memorable name to identify this instance across your
                dashboard and activity logs.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError className="text-left" errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="sshKeyId"
          render={({ field, fieldState }) => {
            const selectedKey = sshKeys?.find((key) => key.id === field.value)

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent className="space-y-2">
                  <FieldLabel htmlFor={field.name}>SSH Key</FieldLabel>
                  <ButtonGroup className="w-full">
                    <Combobox
                      items={sshKeys}
                      itemToStringLabel={(key) => key.name}
                      onValueChange={(key) => {
                        field.onChange(key?.id ?? "")
                      }}
                      value={selectedKey}
                    >
                      <ComboboxInput
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                        placeholder="Select an SSH key"
                      >
                        <InputGroupAddon>
                          <IconKey />
                        </InputGroupAddon>
                        <InputGroupAddon
                          align="inline-end"
                          className="order-2 @md:inline-flex hidden text-xs"
                        >
                          {sshKeys?.length || 0} available
                        </InputGroupAddon>
                      </ComboboxInput>
                      <ComboboxContent
                        alignOffset={-14}
                        className="w-full bg-input/30"
                      >
                        <ComboboxList>
                          <ComboboxGroup>
                            <ComboboxLabel className="uppercase">
                              Select an access key
                            </ComboboxLabel>
                            <ComboboxCollection>
                              {(item: SSHKey) => (
                                <ComboboxItem key={item.id} value={item}>
                                  {item.name}
                                </ComboboxItem>
                              )}
                            </ComboboxCollection>
                          </ComboboxGroup>
                        </ComboboxList>
                        <ComboboxEmpty>No SSH keys found.</ComboboxEmpty>
                        <div className="flex items-center justify-start border-t p-2">
                          <Button
                            nativeButton={false}
                            render={<Link href="/ssh-keys?new=generate" />}
                            variant="link"
                          >
                            <IconSparkles2 /> Generate SSH Key
                          </Button>
                          <Button
                            nativeButton={false}
                            render={<Link href="/ssh-keys?new=import" />}
                            variant="link"
                          >
                            <IconUpload /> Import SSH Key
                          </Button>
                        </div>
                      </ComboboxContent>
                    </Combobox>
                  </ButtonGroup>
                  <FieldDescription>
                    SSH keys will be installed on the instance to allow you to
                    connect securely after launch.
                  </FieldDescription>
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError
                    className="text-left"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )
          }}
        />
      </FieldGroup>

      <Alert className="py-4" variant="warning">
        <IconShieldCheck />
        <AlertTitle className="font-semibold dark:text-primary-foreground">
          Security Notice
        </AlertTitle>
        <AlertDescription className="mt-1 text-foreground/70!">
          SSH access is the only connection method enabled. Password-based
          logins are disabled for security reasons.
        </AlertDescription>
      </Alert>

      <Alert className="py-4" variant="info">
        <IconShieldCheck />
        <AlertTitle className="font-semibold dark:text-primary-foreground">
          SSH Access Delay
        </AlertTitle>
        <AlertDescription className="mt-1 text-foreground/70!">
          After the instance reports as running, there may be a short delay
          before SSH access is available due to boot timing. Please wait a few
          moments before attempting to connect.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end gap-4">
        <Button
          disabled={
            form.formState.isSubmitting ||
            !form.watch("hostname") ||
            !form.watch("sshKeyId")
          }
          type="submit"
        >
          Next <IconArrowRight />
        </Button>
      </div>
    </form>
  )
}

function OperatingSystemForm({
  defaultValues,
  onNext,
  onPrev,
}: {
  defaultValues?: OperatingSystemInfo
  onNext: (d: OperatingSystemInfo) => void
  onPrev: () => void
}) {
  const form = useForm<OperatingSystemInfo>({
    defaultValues: defaultValues || {
      operatingSystemId: "",
    },
    resolver: zodResolver(operatingSystemSchema),
  })

  const { data: operatingSystemCategories } =
    api.operatingSystem.category.list.useQuery()
  const { data: operatingSystems } = api.operatingSystem.list.useQuery()

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when defaultValues changes
  React.useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues])

  return (
    <form className="space-y-8" onSubmit={form.handleSubmit(onNext)}>
      <Controller
        control={form.control}
        name="operatingSystemId"
        render={({ field, fieldState }) => (
          <FieldSet className="@container">
            <FieldLegend>Operating System</FieldLegend>
            <FieldDescription>
              Select an operating system for your instance.
            </FieldDescription>

            <Tabs defaultValue={operatingSystemCategories?.[0]?.id}>
              <TabsList className="h-12! w-full" variant="line">
                {operatingSystemCategories
                  ?.filter((category) =>
                    operatingSystems?.some(
                      (os) =>
                        os.release?.categoryId === category.id &&
                        os.status === "active",
                    ),
                  )
                  ?.map((category) => {
                    const Icon = getOperatingSystemCategoryIcon(category.name)

                    return (
                      <TabsTrigger
                        className="cursor-pointer after:bg-primary group-data-[variant=line]/tabs-list:data-active:border group-data-[variant=line]/tabs-list:data-active:border-primary/50! group-data-[variant=line]/tabs-list:data-active:bg-primary/10! group-data-[variant=line]/tabs-list:data-active:after:opacity-0"
                        key={category.id}
                        value={category.id}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="size-6" />
                          <span className="font-semibold text-base capitalize">
                            {category.name}
                          </span>
                        </div>
                      </TabsTrigger>
                    )
                  })}
              </TabsList>
              {operatingSystemCategories?.map((category) => {
                const operatingSystemFamilies = Array.from(
                  new Set(
                    operatingSystems
                      ?.filter(
                        (os) =>
                          os.release?.categoryId === category.id &&
                          os.status === "active",
                      )
                      .map((os) => os.release?.family) || [],
                  ),
                )

                if (
                  !operatingSystemFamilies ||
                  operatingSystemFamilies.length === 0
                ) {
                  return (
                    <TabsContent
                      className="h-full min-h-0 flex-1 py-4"
                      key={category.id}
                      value={category.id}
                    >
                      <div className="rounded-md border border-dashed p-8 text-center">
                        <p className="mt-2 font-medium text-sm">
                          No{" "}
                          <strong className="capitalize">
                            {category.name}{" "}
                          </strong>
                          images found
                        </p>
                        <p className="mx-auto mt-2 max-w-md text-balance text-muted-foreground text-sm">
                          Unfortunately, there are no images available in this
                          category.
                        </p>
                      </div>
                    </TabsContent>
                  )
                }

                return (
                  <TabsContent
                    className="h-full min-h-0 flex-1 py-4"
                    key={category.id}
                    value={category.id}
                  >
                    <Tabs defaultValue={operatingSystemFamilies[0]}>
                      <ScrollArea className="h-10.5 w-full">
                        <TabsList
                          className="flex h-10! w-max min-w-full gap-2"
                          variant="line"
                        >
                          {operatingSystemFamilies.map((family) => {
                            const Icon = getOperatingSystemFamilyIcon(family)

                            return (
                              <TabsTrigger
                                className="cursor-pointer after:bg-primary group-data-[variant=line]/tabs-list:data-active:border group-data-[variant=line]/tabs-list:data-active:border-primary/50! group-data-[variant=line]/tabs-list:data-active:bg-primary/10! group-data-[variant=line]/tabs-list:data-active:after:opacity-0"
                                key={family}
                                value={family}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="size-6" />
                                  <span className="font-semibold text-base capitalize">
                                    {family}
                                  </span>
                                </div>
                              </TabsTrigger>
                            )
                          })}
                        </TabsList>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                      {operatingSystemFamilies.map((family) => {
                        const filteredOperatingSystems =
                          operatingSystems?.filter(
                            (os) => os.release?.family === family,
                          )

                        return (
                          <TabsContent
                            className="h-full min-h-0 flex-1 py-4"
                            key={family}
                            value={family}
                          >
                            <RadioGroup
                              className="grid @4xl:grid-cols-3 @lg:grid-cols-2 grid-cols-1 gap-4"
                              name={field.name}
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              {filteredOperatingSystems?.map(
                                (operatingSystem) => {
                                  const Icon = getOperatingSystemFamilyIcon(
                                    operatingSystem.release?.family,
                                  )

                                  return (
                                    <FieldLabel
                                      aria-disabled={
                                        operatingSystem.status !== "active"
                                      }
                                      className={cn(
                                        "border-l-4! bg-input/30 text-foreground! has-data-checked:border-primary/50! has-data-checked:hover:bg-primary/10!",
                                        getOperatingSystemStatusColor(
                                          operatingSystem.status,
                                        ),
                                      )}
                                      htmlFor={`operatingSystem-${operatingSystem.slug}`}
                                      key={operatingSystem.id}
                                    >
                                      <Field
                                        className="disabled:cursor-not-allowed disabled:opacity-50"
                                        data-invalid={fieldState.invalid}
                                        disabled={
                                          operatingSystem.status !== "active"
                                        }
                                        orientation="horizontal"
                                      >
                                        <FieldContent className="flex-row items-center gap-2">
                                          <Icon className="size-10" />
                                          <div className="flex flex-col items-start gap-1">
                                            <FieldTitle>
                                              {operatingSystem.name}
                                            </FieldTitle>
                                            {operatingSystem.release
                                              ?.codename && (
                                              <FieldDescription className="text-foreground/70 capitalize">
                                                {
                                                  operatingSystem.release
                                                    ?.codename
                                                }
                                              </FieldDescription>
                                            )}
                                          </div>
                                        </FieldContent>
                                        <RadioGroupItem
                                          aria-invalid={fieldState.invalid}
                                          id={`operatingSystem-${operatingSystem.slug}`}
                                          value={operatingSystem.id}
                                        />
                                      </Field>
                                    </FieldLabel>
                                  )
                                },
                              )}
                            </RadioGroup>
                          </TabsContent>
                        )
                      })}
                    </Tabs>
                  </TabsContent>
                )
              })}
            </Tabs>
            {fieldState.invalid && (
              <FieldError className="text-left" errors={[fieldState.error]} />
            )}
          </FieldSet>
        )}
      />

      <div className="flex justify-end gap-4">
        <Button onClick={onPrev} type="button" variant="secondary">
          <IconArrowLeft /> Previous
        </Button>
        <Button
          disabled={
            form.formState.isSubmitting || !form.watch("operatingSystemId")
          }
          type="submit"
        >
          Next <IconArrowRight />
        </Button>
      </div>
    </form>
  )
}

function ResourcePlanForm({
  defaultValues,
  onNext,
  onPrev,
}: {
  defaultValues?: ResourcePlanInfo
  onNext: (d: ResourcePlanInfo) => void
  onPrev: () => void
}) {
  const form = useForm<ResourcePlanInfo>({
    defaultValues: defaultValues || {
      resourcePlanId: "",
    },
    resolver: zodResolver(resourcePlanSchema),
  })

  const { data: resourcePlans } = api.resourcePlan.list.useQuery()

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when defaultValues changes
  React.useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues])

  return (
    <form className="space-y-8" onSubmit={form.handleSubmit(onNext)}>
      <Controller
        control={form.control}
        name="resourcePlanId"
        render={({ field, fieldState }) => (
          <FieldSet className="@container">
            <FieldLegend>Resource Plan</FieldLegend>
            <FieldDescription>
              Select a plan for your instance. Each plan has different resource
              allocations.
            </FieldDescription>
            <RadioGroup
              className="grid @3xl:grid-cols-2 @6xl:grid-cols-3 grid-cols-1 gap-4"
              name={field.name}
              onValueChange={field.onChange}
              value={field.value}
            >
              {resourcePlans
                ?.filter((plan) => plan.status === "active")
                ?.map((plan) => {
                  const Icon = getResourcePlanIcon(plan.slug)

                  return (
                    <FieldLabel
                      aria-disabled={plan.status !== "active"}
                      className={cn(
                        "border-l-4! bg-input/30 text-foreground! has-data-checked:border-primary/50! has-data-checked:hover:bg-primary/10!",
                        getResourcePlanStatusColor(plan.status),
                      )}
                      htmlFor={`plan-${plan.id}`}
                      key={plan.id}
                    >
                      <Field
                        className="disabled:cursor-not-allowed disabled:opacity-50"
                        data-invalid={fieldState.invalid}
                        disabled={plan.status !== "active"}
                        orientation="horizontal"
                      >
                        <FieldContent className="space-y-2">
                          <div className="mb-1 flex items-center gap-2">
                            <Icon className="size-5" />
                            <FieldTitle>{plan.name}</FieldTitle>
                          </div>
                          <FieldDescription className="text-foreground/70 text-xs">
                            {plan.description}
                          </FieldDescription>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant="outline">
                              {plan.cores} vCPU{plan.cores > 1 ? "s" : ""}
                            </Badge>
                            <Badge variant="outline">
                              {plan.memory} Memory
                            </Badge>
                            <Badge variant="outline">{plan.disk} GB Disk</Badge>
                          </div>
                        </FieldContent>
                        <RadioGroupItem
                          aria-invalid={fieldState.invalid}
                          id={`plan-${plan.id}`}
                          value={plan.id}
                        />
                      </Field>
                    </FieldLabel>
                  )
                })}
            </RadioGroup>
            {fieldState.invalid && (
              <FieldError className="text-left" errors={[fieldState.error]} />
            )}
          </FieldSet>
        )}
      />

      <div className="flex justify-end gap-4">
        <Button onClick={onPrev} type="button" variant="secondary">
          <IconArrowLeft /> Previous
        </Button>
        <Button
          disabled={
            form.formState.isSubmitting || !form.watch("resourcePlanId")
          }
          type="submit"
        >
          Next <IconArrowRight />
        </Button>
      </div>
    </form>
  )
}

function ReviewAndCreateForm({
  defaultValues,
  onEditStep,
  onPrev,
  onReset,
}: {
  defaultValues?: FormData
  onEditStep: (stepId: string) => void
  onPrev: () => void
  onReset: () => void
}) {
  const router = useRouter()
  const utils = api.useUtils()

  const form = useForm<ReviewAndCreateInfo>({
    defaultValues: {
      ...defaultValues?.basics,
      ...defaultValues?.operatingSystem,
      ...defaultValues?.resources,
    },
    resolver: zodResolver(refinedCreateInstanceSchema),
  })

  const { data: sshKeys } = api.sshKey.list.useQuery()
  const { data: operatingSystems } = api.operatingSystem.list.useQuery()
  const { data: resourcePlans } = api.resourcePlan.list.useQuery()

  const selectedSSHKey = sshKeys?.find(
    (key) => key.id === defaultValues?.basics?.sshKeyId,
  )
  const selectedOs = operatingSystems?.find(
    (os) => os.id === defaultValues?.operatingSystem?.operatingSystemId,
  )
  const selectedPlan = resourcePlans?.find(
    (plan) => plan.id === defaultValues?.resources?.resourcePlanId,
  )

  const OsIcon = getOperatingSystemFamilyIcon(selectedOs?.release?.family)
  const PlanIcon = getResourcePlanIcon(selectedPlan?.slug)

  const mutation = api.instance.create.useMutation({
    onError(error) {
      toast.error("Failed to create instance:", {
        description: error.message,
        position: "top-center",
      })
    },
    onSuccess(data) {
      void utils.instance.list.invalidate()
      toast.success("Instance created successfully!", {
        position: "top-center",
      })
      onReset()
      router.push(`/instance/${data.instanceId}`)
    },
  })

  const isPending = mutation.isPending || form.formState.isSubmitting

  function onSubmit(data: z.infer<typeof refinedCreateInstanceSchema>) {
    if (isPending) return
    mutation.mutate(data)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when defaultValues changes
  React.useEffect(() => {
    form.reset({
      ...defaultValues?.basics,
      ...defaultValues?.operatingSystem,
      ...defaultValues?.resources,
    })
  }, [defaultValues])

  return (
    <form
      className="@container space-y-8"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-1 text-left">
        <h3 className="font-semibold text-lg">Review & Create</h3>
        <p className="text-muted-foreground text-sm">
          Confirm everything looks right before launching your instance.
        </p>
      </div>

      <div className="grid @2xl:grid-cols-2 gap-4">
        <div className="@container flex flex-col gap-4 rounded-lg border bg-input/30 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Basics
            </span>
            <Button
              onClick={() => onEditStep("basics")}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <IconEdit />
              <span className="sr-only">Edit</span>
            </Button>
          </div>

          <div className="flex @sm:flex-row flex-col @sm:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <IconServer className="size-5" />
              </div>
              <div className="flex min-w-0 flex-col text-left">
                <span className="line-clamp-1 font-medium">
                  {defaultValues?.basics?.hostname || "—"}
                </span>
                <span className="text-muted-foreground text-xs">Hostname</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <IconKey className="size-5" />
              </div>
              <div className="flex min-w-0 flex-col text-left">
                <span className="line-clamp-1 font-medium">
                  {selectedSSHKey?.name ?? "—"}
                </span>
                <span className="text-muted-foreground text-xs">SSH key</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border bg-input/30 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Operating System
            </span>
            <Button
              onClick={() => onEditStep("operating-system")}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <IconEdit />
              <span className="sr-only">Edit</span>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <OsIcon className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <span className="line-clamp-1 font-medium">
                {selectedOs?.name ?? "—"}
              </span>
              {selectedOs?.release?.codename && (
                <span className="line-clamp-1 text-muted-foreground text-xs capitalize">
                  {selectedOs.release.codename}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="@2xl:col-span-2 flex flex-col gap-4 rounded-lg border bg-input/30 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Resource Plan
            </span>
            <Button
              onClick={() => onEditStep("resources")}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <IconEdit />
              <span className="sr-only">Edit</span>
            </Button>
          </div>

          <div className="@container flex flex-wrap items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PlanIcon className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <span className="line-clamp-1 font-medium">
                {selectedPlan?.name ?? "—"}
              </span>
              {selectedPlan?.description && (
                <span className="line-clamp-2 text-wrap text-muted-foreground text-xs">
                  {selectedPlan.description}
                </span>
              )}
            </div>

            {selectedPlan && (
              <div className="ml-auto flex flex-wrap gap-2">
                <Badge variant="outline">
                  {selectedPlan.cores} vCPU{selectedPlan.cores > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline">{selectedPlan.memory} Memory</Badge>
                <Badge variant="outline">{selectedPlan.disk} GB Disk</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 max-md:justify-end">
        <Button
          className="hidden md:inline-flex"
          disabled={isPending}
          onClick={onReset}
          type="button"
          variant="secondary"
        >
          <IconRefreshAlert /> Reset
        </Button>
        <Button
          className="md:ml-auto"
          disabled={isPending}
          onClick={onPrev}
          type="button"
          variant="secondary"
        >
          <IconArrowNarrowLeft /> Previous
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? <Spinner /> : <IconCirclePlus />}
          Create <span className="max-sm:hidden">Instance</span>
        </Button>
      </div>
    </form>
  )
}

const STEPS = [
  {
    description: "Name & access",
    id: "basics",
    title: "Basics",
  },
  {
    description: "Choose an image",
    id: "image",
    title: "Image",
  },
  {
    description: "Size your instance",
    id: "resources",
    title: "Resources",
  },
  {
    description: "Confirm configuration",
    id: "review",
    title: "Review",
  },
]

export function CreateInstanceForm() {
  const [current, setCurrent] = React.useState(STEPS[0].id)
  const [formData, setFormData] = React.useState<FormData>({})

  const currentStep = STEPS.findIndex((s) => s.id === current)
  const goNext = () =>
    setCurrent(STEPS[Math.min(currentStep + 1, STEPS.length - 1)].id)
  const goBack = () => setCurrent(STEPS[Math.max(currentStep - 1, 0)].id)

  function resetAll() {
    setFormData({})
    setCurrent(STEPS[0].id)
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-4 max-md:px-0">
        <Stepper
          className="flex flex-col items-center justify-center gap-6"
          onValueChange={(v) => {
            if (v !== current) return
            setCurrent(v)
          }}
          orientation="horizontal"
          steps={STEPS}
          value={current}
        >
          <StepperNav>
            {STEPS.map((step, idx) => (
              <StepperItem
                className="relative flex-1"
                key={idx}
                stepId={step.id}
              >
                <StepperTrigger className="pointer-events-none flex flex-col gap-2.5">
                  <StepperIndicator>{idx + 1}</StepperIndicator>
                  <div className="flex flex-col">
                    <StepperTitle className="max-sm:hidden">
                      {step.title}
                    </StepperTitle>
                    <StepperDescription className="text-nowrap max-md:hidden">
                      {step.description}
                    </StepperDescription>
                  </div>
                </StepperTrigger>
                {STEPS.length > idx + 1 && (
                  <StepperSeparator className="absolute inset-x-0 top-2 right-[calc(-50%+18px)] left-[calc(50%+18px)]" />
                )}
              </StepperItem>
            ))}
          </StepperNav>
          <StepperPanel className="w-full text-center text-sm md:max-w-7xl">
            {STEPS.map((step) => (
              <StepperContent key={step.id} value={step.id}>
                <div className="flex flex-col items-center gap-4 px-8">
                  <div className="w-full">
                    {step.id === "basics" && (
                      <BasicInfoForm
                        defaultValues={formData.basics}
                        onNext={(data: BasicInfo) => {
                          setFormData((prev) => ({ ...prev, basics: data }))
                          goNext()
                        }}
                      />
                    )}

                    {step.id === "image" && (
                      <OperatingSystemForm
                        defaultValues={formData.operatingSystem}
                        onNext={(data: OperatingSystemInfo) => {
                          setFormData((prev) => ({
                            ...prev,
                            operatingSystem: data,
                          }))
                          goNext()
                        }}
                        onPrev={() => goBack()}
                      />
                    )}

                    {step.id === "resources" && (
                      <ResourcePlanForm
                        defaultValues={formData.resources}
                        onNext={(data: ResourcePlanInfo) => {
                          setFormData((prev) => ({
                            ...prev,
                            resources: data,
                          }))
                          goNext()
                        }}
                        onPrev={() => goBack()}
                      />
                    )}

                    {step.id === "review" && (
                      <ReviewAndCreateForm
                        defaultValues={formData}
                        onEditStep={(stepId) => setCurrent(stepId)}
                        onPrev={() => goBack()}
                        onReset={resetAll}
                      />
                    )}
                  </div>
                </div>
              </StepperContent>
            ))}
          </StepperPanel>
        </Stepper>
      </CardContent>
    </Card>
  )
}

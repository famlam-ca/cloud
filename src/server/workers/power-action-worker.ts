import { Worker, createNodeRedisClient } from "bullmq"
import { eq } from "drizzle-orm"

import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import { instanceTable } from "@/server/db/schema"
import { getInstanceStatusFromProxmox } from "@/server/queries/instance"
import { logActivity } from "@/server/services/activity"
import {
  isVmNotFoundError,
  rebootInstance,
  shutdownInstance,
  startInstance,
  stopInstance,
} from "@/server/services/instance"

import {
  POWER_ACTION_QUEUE_KEY,
  addPowerActionSchema,
} from "../queues/power-action-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

const powerActionWorker = new Worker(
  POWER_ACTION_QUEUE_KEY,
  async (job): Promise<{ status: string; vmid: string }> => {
    const data = addPowerActionSchema.parse(job.data)

    const instance = await db.query.instanceTable.findFirst({
      where: (i, { eq }) => eq(i.id, data.instanceId),
    })

    if (!instance) throw new Error("Instance not found")

    try {
      switch (data.action) {
        case "start":
          await startInstance(proxmox, instance.pveVmid)
          break
        case "reboot":
          await rebootInstance(proxmox, instance.pveVmid)
          break
        case "shutdown":
          await shutdownInstance(proxmox, instance.pveVmid)
          break
        case "stop":
          await stopInstance(proxmox, instance.pveVmid)
          break
        default:
          data.action satisfies never
          throw new Error("Unhandled power action:" + data.action)
      }
    } catch (error) {
      if (isVmNotFoundError(error)) {
        console.warn(`Instance ${instance.pveVmid} does not exist.`)
      }
      throw error
    }

    const currentStatus = await getInstanceStatusFromProxmox(proxmox, {
      pveVmid: instance.pveVmid,
    })

    if (currentStatus === "unknown") {
      throw new Error(
        `Instance ${instance.pveVmid} status is unknown. Setting status to 'failed'.`,
      )
    }

    return {
      status: "success",
      vmid: String(instance.pveVmid),
    }
  },
  {
    autorun: false,
    concurrency: 1,
    connection,
    limiter: { duration: 1000, max: 1 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
)

powerActionWorker.on("completed", async (job) => {
  console.info(`Power action job ${job.id} completed`)

  if (!job?.data.instanceId) return

  const instance = await db.query.instanceTable.findFirst({
    columns: { hostname: true, id: true, organizationId: true, pveVmid: true },
    where: (i, { eq }) => eq(i.id, job.data.instanceId),
  })

  if (!instance) return

  // cast as Exclude "unknown" because we throw if currentStatus is "unknown" in the worker
  const currentStatus = (await getInstanceStatusFromProxmox(proxmox, {
    pveVmid: instance.pveVmid,
  })) as Exclude<
    Awaited<ReturnType<typeof getInstanceStatusFromProxmox>>,
    "unknown"
  >

  await db
    .update(instanceTable)
    .set({ status: currentStatus })
    .where(eq(instanceTable.id, instance.id))
})

powerActionWorker.on("failed", async (job, err) => {
  console.error(`Power action job ${job?.id} failed: ${err.message}`)

  if (!job?.data.instanceId) return

  const maxAttempts = job.opts.attempts ?? 1
  const isFinalAttempt = job.attemptsMade >= maxAttempts

  if (!isFinalAttempt) return

  const instance = await db.query.instanceTable.findFirst({
    columns: { hostname: true, id: true, organizationId: true, pveVmid: true },
    where: (i, { eq }) => eq(i.id, job.data.instanceId),
  })

  if (!instance) return

  const currentStatus = await getInstanceStatusFromProxmox(proxmox, {
    pveVmid: instance.pveVmid,
  })

  await db
    .update(instanceTable)
    .set({ status: currentStatus === "unknown" ? "failed" : currentStatus })
    .where(eq(instanceTable.id, instance.id))
    .returning()

  await logActivity(db, "instance_power_action_failed", {
    actorType: "system",
    channel: "worker",
    metadata: {
      error: err?.message ?? "Unknown error",
      instance,
    },
    organizationId: instance.organizationId,
    referenceId: instance.id,
    referenceType: "instance",
  })
})

void powerActionWorker.run()

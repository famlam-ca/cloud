import type { Job } from "bullmq"
import { createNodeRedisClient, Worker } from "bullmq"
import { eq } from "drizzle-orm"

import { env } from "@/env"
import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import { instanceTable } from "@/server/db/schema"
import { logActivity } from "@/server/services/activity"
import {
  cloneInstance,
  configureInstance,
  configureInstanceFirewall,
  startInstance,
} from "@/server/services/instance"

import {
  addProvisionJobSchema,
  PROVISION_QUEUE_KEY,
} from "../queues/provision-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

const provisionWorker = new Worker(
  PROVISION_QUEUE_KEY,
  async (job: Job): Promise<{ status: string; vmid: string }> => {
    try {
      const data = addProvisionJobSchema.parse(job.data)

      const [instance] = await db
        .update(instanceTable)
        .set({ status: "provisioning" })
        .where(eq(instanceTable.id, data.instanceId))
        .returning()

      if (!instance) throw new Error("Instance not found")

      const operatingSystem = await db.query.operatingSystemTable.findFirst({
        where: (i, { eq }) => eq(i.id, instance.operatingSystemId),
      })

      if (!operatingSystem) throw new Error("Operating system not found")

      await cloneInstance(proxmox, {
        hostname: instance.hostname,
        nextVmid: instance.pveVmid,
        osVmid: operatingSystem.pveVmid,
      })

      await configureInstance(proxmox, {
        macAddress: data.macAddress,
        network: data.network,
        nextVmid: instance.pveVmid,
        plan: data.plan,
        sshKeyId: data.sshKeyId,
      })

      await configureInstanceFirewall(proxmox, {
        adminCidr: env.PLATFORM_ADMIN_CIDR,
        hostname: instance.hostname,
        internetAccess: instance.internetAccess,
        network: data.network,
        organizationId: instance.organizationId,
        vmid: instance.pveVmid,
      })

      const newInstance = await startInstance(proxmox, instance.pveVmid)

      return {
        status: "running",
        vmid: String(newInstance.vmid),
      }
    } catch (error) {
      console.error("Provision job failed:", error)
      throw new Error(error instanceof Error ? error.message : "Unknown error")
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

provisionWorker.on("completed", async (job) => {
  console.info("Provision job completed:", job.id, job.returnvalue)

  if (!job?.data.instanceId) return

  const [instance] = await db
    .update(instanceTable)
    .set({ status: "running" })
    .where(eq(instanceTable.id, job.data.instanceId))
    .returning()

  if (!instance) return
})

provisionWorker.on("failed", async (job, error) => {
  console.error("Worker failed:", job?.id, error)

  if (!job?.data.instanceId) return

  const maxAttempts = job.opts.attempts ?? 1
  const isFinalAttempt = job.attemptsMade >= maxAttempts

  if (!isFinalAttempt) return

  const [instance] = await db
    .update(instanceTable)
    .set({ status: "failed" })
    .where(eq(instanceTable.id, job.data.instanceId))
    .returning()

  if (!instance) return

  await logActivity(db, "instance_provisioning_failed", {
    actorType: "system",
    channel: "worker",
    metadata: {
      error: error?.message ?? "Unknown error",
      instance,
    },
    organizationId: instance.organizationId,
    referenceId: instance.id,
    referenceType: "instance",
  })
})

provisionWorker.run()

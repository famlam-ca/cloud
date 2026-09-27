import type { Job } from "bullmq"
import { createNodeRedisClient, Worker } from "bullmq"
import { eq } from "drizzle-orm"

import { env } from "@/env"
import { validateSourcePair } from "@/lib/network"
import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import { instanceTable } from "@/server/db/schema"
import {
  FIREWALL_SYNC_QUEUE_KEY,
  firewallSyncJobSchema,
} from "@/server/queues/firewall-sync-queue"
import { logActivity } from "@/server/services/activity"
import {
  buildPlatformRules,
  replaceProxmoxRules,
  toProxmoxRule,
} from "@/server/services/firewall"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

const firewallSyncWorker = new Worker(
  FIREWALL_SYNC_QUEUE_KEY,
  async (job: Job): Promise<void> => {
    const { instanceId } = firewallSyncJobSchema.parse(job.data)

    const instance = await db.query.instanceTable.findFirst({
      where: (i, { eq }) => eq(i.id, instanceId),
    })

    if (!instance) return

    try {
      const queriedRules = await db.query.instanceFirewallRuleTable.findMany({
        orderBy: (i, { asc }) => asc(i.priority),
        where: (i, { eq }) => eq(i.instanceId, instanceId),
      })

      for (const rule of queriedRules) {
        if (rule.sourceType === "cidr" && rule.sourceCidr) {
          const error = validateSourcePair(rule.sourceType, rule.sourceCidr)
          if (error) {
            throw new Error(
              `Rule "${rule.comment || rule.id}" has an invalid CIDR: ${error}`,
            )
          }
        }
      }

      const platformRules = buildPlatformRules({
        adminCidr: env.PLATFORM_ADMIN_CIDR,
        internetAccess: instance.internetAccess,
        organizationId: instance.organizationId,
        subnetCidr: env.CLOUD_NETWORK_CIDR,
      })

      const userRules = queriedRules.map((rule) =>
        toProxmoxRule(rule, { organizationId: instance.organizationId }),
      )

      await replaceProxmoxRules(proxmox, {
        rules: [...userRules, ...platformRules],
        vmid: instance.pveVmid,
      })
    } catch (error) {
      throw new Error(
        `Failed to sync firewall rules for instance ${instanceId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
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

firewallSyncWorker.on("completed", async (job) => {
  console.info("Firewall sync job completed:", job.id, job.returnvalue)

  if (!job?.data.instanceId) return

  const [instance] = await db
    .update(instanceTable)
    .set({
      firewallSyncError: null,
      firewallSyncedAt: new Date(),
      firewallSyncStatus: "synced",
    })
    .where(eq(instanceTable.id, job.data.instanceId))
    .returning()

  if (!instance) return
})

firewallSyncWorker.on("failed", async (job, error) => {
  console.error("Firewall sync job failed:", job?.id, error)

  if (!job?.data.instanceId) return

  const maxAttempts = job.opts.attempts ?? 1
  const isFinalAttempt = job.attemptsMade >= maxAttempts

  if (!isFinalAttempt) return

  const [instance] = await db
    .update(instanceTable)
    .set({
      firewallSyncError:
        error instanceof Error ? error.message : "Unknown error",
      firewallSyncStatus: "failed",
    })
    .where(eq(instanceTable.id, job.data.instanceId))
    .returning()

  if (!instance) return

  await logActivity(db, "firewall_sync_failed", {
    actorType: "system",
    channel: "worker",
    metadata: { error: error?.message ?? "Unknown error" },
    organizationId: instance.organizationId,
    referenceId: instance.id,
    referenceType: "instance",
  })
})

firewallSyncWorker.run()

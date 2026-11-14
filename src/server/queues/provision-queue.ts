import type { Job } from "bullmq"
import { Queue, createNodeRedisClient } from "bullmq"
import * as z from "zod"

import { getRedisClient } from "@/lib/redis"
import { selectResourcePlanSchema } from "@/schemas/resource-plan"

export const PROVISION_QUEUE_KEY = "cloud-provision-queue"

let provisionQueue: Queue | null = null

function getProvisionQueue(): Queue {
  if (!provisionQueue) {
    const redis = getRedisClient()
    const connection = createNodeRedisClient(redis)

    provisionQueue = new Queue(PROVISION_QUEUE_KEY, {
      connection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 24 * 3600 },
      },
    })
  }
  return provisionQueue
}

export const addProvisionJobSchema = z.object({
  instanceId: z.uuid(),
  macAddress: z.mac(),
  network: z.object({
    gateway: z.ipv4(),
    id: z.string(),
    ip: z.string().refine((val) => {
      const ip = val.split("/")[0]
      return z.ipv4().safeParse(ip).success
    }),
  }),
  plan: selectResourcePlanSchema,
  sshKeyId: z.string(),
})

export async function addProvisionJob(
  data: z.infer<typeof addProvisionJobSchema>,
): Promise<{ jobId: Job["id"] }> {
  const parsed = addProvisionJobSchema.parse(data)

  const jobId = `${parsed.instanceId}-${parsed.macAddress.replace(/:/g, "-")}`

  const provisionJob = await getProvisionQueue().add(
    PROVISION_QUEUE_KEY,
    parsed,
    { deduplication: { id: jobId }, jobId },
  )

  return { jobId: provisionJob.id }
}

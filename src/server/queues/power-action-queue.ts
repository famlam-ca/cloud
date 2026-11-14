import type { Job } from "bullmq"
import { Queue, createNodeRedisClient } from "bullmq"
import * as z from "zod"

import { getRedisClient } from "@/lib/redis"
import { instancePowerActionEnum } from "@/schemas/instance"

export const POWER_ACTION_QUEUE_KEY = "cloud-power-action-queue"

let powerActionQueue: Queue | null = null

function getPowerActionQueue(): Queue {
  if (!powerActionQueue) {
    const redis = getRedisClient()
    const connection = createNodeRedisClient(redis)

    powerActionQueue = new Queue(POWER_ACTION_QUEUE_KEY, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 2000, type: "exponential" },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 24 * 3600 },
      },
    })
  }
  return powerActionQueue
}

export const addPowerActionSchema = z.object({
  action: instancePowerActionEnum,
  instanceId: z.uuid(),
})

export async function addPowerActionJob(
  data: z.infer<typeof addPowerActionSchema>,
): Promise<{ jobId: Job["id"] }> {
  const parsed = addPowerActionSchema.parse(data)

  const jobId = `power-action-${parsed.action}-${parsed.instanceId}-job`

  const powerActionJob = await getPowerActionQueue().add(
    POWER_ACTION_QUEUE_KEY,
    parsed,
    { deduplication: { id: jobId }, jobId },
  )

  return { jobId: powerActionJob.id }
}

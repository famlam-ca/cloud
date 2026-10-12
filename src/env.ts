import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const createVmidRangeSchema = (key: string) =>
  z.string().transform((value) => {
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed) || parsed.length !== 2) {
        throw new Error(`${key} must be a JSON array with two elements`)
      }
      const [min, max] = parsed
      if (typeof min !== "number" || typeof max !== "number") {
        throw new Error(`${key} elements must be numbers`)
      }
      return [min, max] as [number, number]
    } catch (error) {
      throw new Error(
        `Invalid ${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  })

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_VERSION: z.string(),
    NEXT_PUBLIC_OAUTH_PROVIDER_ID: z.string(),
    NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE: createVmidRangeSchema(
      "NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE",
    ),
    NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE: createVmidRangeSchema(
      "NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE",
    ),
    NEXT_PUBLIC_URL: z.url(),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    CLOUD_NETWORK_CIDR: process.env.CLOUD_NETWORK_CIDR,
    DATABASE_URL: process.env.DATABASE_URL,
    DEV_ACTIVITY_RETENTION_DAYS: process.env.DEV_ACTIVITY_RETENTION_DAYS,
    ENCRYPTION_KEY_V1: process.env.ENCRYPTION_KEY_V1,
    NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
    NEXT_PUBLIC_OAUTH_PROVIDER_ID: process.env.NEXT_PUBLIC_OAUTH_PROVIDER_ID,
    NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE:
      process.env.NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE,
    NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE:
      process.env.NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NODE_ENV: process.env.NODE_ENV,
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
    OAUTH_DISCOVERY_URL: process.env.OAUTH_DISCOVERY_URL,
    OPNSENSE_API_ENDPOINT: process.env.OPNSENSE_API_ENDPOINT,
    OPNSENSE_API_KEY: process.env.OPNSENSE_API_KEY,
    OPNSENSE_API_SECRET: process.env.OPNSENSE_API_SECRET,
    OPNSENSE_CLOUD_NETWORK_VLAN_ID: process.env.OPNSENSE_CLOUD_NETWORK_VLAN_ID,
    OPNSENSE_SUBNET_UUID: process.env.OPNSENSE_SUBNET_UUID,
    PLATFORM_ADMIN_CIDR: process.env.PLATFORM_ADMIN_CIDR,
    PROXMOX_HOST: process.env.PROXMOX_HOST,
    PROXMOX_NODE: process.env.PROXMOX_NODE,
    PROXMOX_POOL: process.env.PROXMOX_POOL,
    PROXMOX_TOKEN_ID: process.env.PROXMOX_TOKEN_ID,
    PROXMOX_TOKEN_SECRET: process.env.PROXMOX_TOKEN_SECRET,
    REDIS_URL: process.env.REDIS_URL,
  },
  server: {
    BETTER_AUTH_SECRET: z.string(),
    CLOUD_NETWORK_CIDR: z.string(),
    DATABASE_URL: z.url(),
    DEV_ACTIVITY_RETENTION_DAYS: z.coerce.number().int().positive().optional(),
    ENCRYPTION_KEY_V1: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OAUTH_CLIENT_ID: z.string(),
    OAUTH_CLIENT_SECRET: z.string(),
    OAUTH_DISCOVERY_URL: z.string(),
    OPNSENSE_API_ENDPOINT: z.string(),
    OPNSENSE_API_KEY: z.string(),
    OPNSENSE_API_SECRET: z.string(),
    OPNSENSE_CLOUD_NETWORK_VLAN_ID: z.string(),
    OPNSENSE_SUBNET_UUID: z.uuid(),
    PLATFORM_ADMIN_CIDR: z.string(),
    PROXMOX_HOST: z.string(),
    PROXMOX_NODE: z.string(),
    PROXMOX_POOL: z.string(),
    PROXMOX_TOKEN_ID: z.string(),
    PROXMOX_TOKEN_SECRET: z.string(),
    REDIS_URL: z.url(),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})

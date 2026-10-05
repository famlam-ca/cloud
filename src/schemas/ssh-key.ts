import * as z from "zod"

export const sshKeyTypes = ["rsa", "ed25519"] as const

const sshKeyConstraints = {
  comment: z.string().max(255).nullish(),
  name: z.string().min(3).max(255),
}

export const insertSSHKeySchema = z.object({
  ...sshKeyConstraints,
  fingerprint: z.string(),
  id: z.string(),
  organizationId: z.string(),
  publicKey: z.string(),
  type: z.enum(sshKeyTypes).default("ed25519"),
  userId: z.string(),
})

export const selectSSHKeySchema = z.object({
  ...sshKeyConstraints,
  comment: z.string().nullable(),
  createdAt: z.date(),
  fingerprint: z.string(),
  id: z.string(),
  organizationId: z.string(),
  publicKey: z.string(),
  type: z.enum(sshKeyTypes),
  updatedAt: z.date(),
  userId: z.string(),
})

export const generateSSHKeySchema = insertSSHKeySchema.pick({
  comment: true,
  name: true,
  type: true,
})
export const importSSHKeySchema = insertSSHKeySchema.pick({
  comment: true,
  name: true,
  publicKey: true,
})

export type SSHKey = z.infer<typeof selectSSHKeySchema>
export type SSHKeyTypeEnum = (typeof sshKeyTypes)[number]

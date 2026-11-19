import { createAccessControl } from "better-auth/plugins"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

const statements = {
  ...defaultStatements,
  apiKey: ["create", "read", "update", "delete"],
  instance: ["create", "read", "update", "delete"],
} as const

export const ac = createAccessControl(statements)

export const ownerRole = ac.newRole({
  ...ownerAc.statements,
  apiKey: ["create", "read", "update", "delete"],
  instance: ["create", "read", "update", "delete"],
})

export const adminRole = ac.newRole({
  ...adminAc.statements,
  apiKey: ["create", "read", "update", "delete"],
  instance: ["create", "read", "update", "delete"],
})

export const memberRole = ac.newRole({
  ...memberAc.statements,
  apiKey: ["read"],
  instance: ["read"],
})

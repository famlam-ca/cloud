import type { Proxmox } from "proxmox-api"

import { env } from "@/env"
import { isProxmoxNotFoundError } from "@/lib/proxmox"
import type { InstanceFirewallRule } from "@/schemas/firewall-rule"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE

export interface ProxmoxFirewallRuleInput {
  action: "ACCEPT" | "DROP"
  comment?: string
  dest?: string
  dport?: string
  enable: 0 | 1
  proto?: "icmp" | "tcp" | "udp"
  source?: string
  type: "in" | "out"
}

interface PlatformRulesInput {
  adminCidr: string
  internetAccess: boolean
  organizationId: string
  subnetCidr: string // cloud network
}

export function buildPlatformRules({
  adminCidr,
  internetAccess,
  organizationId,
  subnetCidr,
}: PlatformRulesInput): ProxmoxFirewallRuleInput[] {
  const orgId = organizationId.toLowerCase()
  const ipsetName = `org_${orgId}`

  const internetAccessRules: ProxmoxFirewallRuleInput[] = [
    {
      action: "ACCEPT",
      comment: `Allow outbound to organization ${orgId}`,
      dest: `+${ipsetName}`,
      enable: 1,
      type: "out",
    },
    // TODO: Future integration
    // {
    //   action: "ACCEPT",
    //   comment: "Allow outbound to internal platform services",
    //   dest: `+${internalServicesIpsetName}`,
    //   enable: 1,
    //   type: "out",
    // },
    {
      action: "DROP",
      comment: "Internet access disabled for this instance",
      dest: "0.0.0.0/0",
      enable: 1,
      type: "out",
    },
  ]

  const platformRules: ProxmoxFirewallRuleInput[] = [
    {
      action: "ACCEPT",
      comment: "Platform operator SSH access",
      dport: "22",
      enable: 1,
      proto: "tcp",
      source: adminCidr,
      type: "in",
    },
    {
      action: "ACCEPT",
      comment: `Allow access from organization ${orgId}`,
      enable: 1,
      source: `+${ipsetName}`,
      type: "in",
    },
    {
      action: "DROP",
      comment: "Deny other tenants on shared subnet",
      enable: 1,
      source: subnetCidr,
      type: "in",
    },
    ...(internetAccess === false ? internetAccessRules : []),
  ]

  return platformRules
}

export function toProxmoxRule(
  rule: InstanceFirewallRule,
  context: { organizationId: string },
): ProxmoxFirewallRuleInput {
  const source =
    rule.sourceType === "cidr"
      ? (rule.sourceCidr ?? undefined)
      : rule.sourceType === "org"
        ? `+org_${context.organizationId.toLowerCase()}`
        : undefined

  return {
    action: rule.action,
    comment: rule.comment ?? undefined,
    dport: rule.protocol === "icmp" ? undefined : (rule.portRange ?? undefined),
    enable: rule.enabled ? 1 : 0,
    proto: rule.protocol === "any" ? undefined : rule.protocol,
    source,
    type: "in",
  }
}

export async function replaceProxmoxRules(
  proxmox: Proxmox.Api,
  data: {
    rules: ProxmoxFirewallRuleInput[]
    vmid: number
  },
) {
  const existingRules = await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.vmid)
    .firewall.rules.$get()

  const byDescendingPos = [...existingRules].sort((a, b) => b.pos - a.pos)

  for (const rule of byDescendingPos) {
    await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.vmid)
      .firewall.rules.$(String(rule.pos))
      .$delete()
      .catch((e) => {
        if (!isProxmoxNotFoundError(e)) throw e
      })
  }

  for (const rule of [...data.rules].reverse()) {
    await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.vmid)
      .firewall.rules.$post(rule)
  }
}

export async function syncPlatformFirewallRules(
  proxmox: Proxmox.Api,
  data: {
    adminCidr: string
    internetAccess: boolean
    organizationId: string
    subnetCidr: string
    vmid: number
  },
) {
  const platformRules = buildPlatformRules({
    adminCidr: data.adminCidr,
    internetAccess: data.internetAccess,
    organizationId: data.organizationId,
    subnetCidr: data.subnetCidr,
  })

  await replaceProxmoxRules(proxmox, {
    rules: platformRules,
    vmid: data.vmid,
  })
}

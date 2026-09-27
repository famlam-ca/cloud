import { isNull, relations, sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTableCreator,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type * as z from "zod"

import type { ActivityType, activityUserSchema } from "@/schemas/activity"

export const createTable = pgTableCreator((name) => name)

export const activityActorEnum = pgEnum("activity_actor", [
  "system",
  "user",
  "external",
])

export const activityChannelEnum = pgEnum("activity_channel", ["api", "worker"])

export const activityReferenceTypeEnum = pgEnum("activity_reference_type", [
  "instance",
  "ssh_key",
  "user",
])

export const activityTable = createTable("activity", (d) => ({
  actorId: d.text("actor_id"),
  actorSnapshot: d
    .jsonb("actor_snapshot")
    .$type<z.infer<typeof activityUserSchema>>(),
  actorType: activityActorEnum("actor_type").notNull(),
  channel: activityChannelEnum("channel").notNull(),
  id: d.uuid("id").primaryKey(),
  metadata: d.jsonb("metadata").$type<Record<string, unknown>>(),
  organizationId: d
    .text("organization_id")
    .references(() => organization.id, { onDelete: "cascade" }),
  referenceId: d.text("reference_id").notNull(),
  referenceType: activityReferenceTypeEnum("reference_type").notNull(),
  timestamp: d.timestamp("timestamp").defaultNow().notNull(),
  type: d.text("type").$type<ActivityType>().notNull(),
}))

export const sshKeyTypeEnum = pgEnum("ssh_key_type", ["rsa", "ed25519"])

export const sshKeyTable = createTable(
  "ssh_key",
  (d) => ({
    comment: d.text("comment"),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    fingerprint: d.text("fingerprint").notNull(),
    id: d.text("id").primaryKey(),
    name: d.text("name").notNull(),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    publicKey: d.text("public_key").notNull(),
    type: sshKeyTypeEnum("type").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("ssh_key_organizationId_idx").on(t.organizationId),
    index("ssh_key_userId_idx").on(t.userId),
    uniqueIndex("ssh_key_name_idx").on(t.organizationId, t.name),
    uniqueIndex("ssh_key_fingerprint_idx").on(t.organizationId, t.fingerprint),
  ],
)

export const operatingSystemCategoryEnum = pgEnum(
  "operating_system_category_name",
  ["linux", "windows"],
)

export const operatingSystemCategoryTable = createTable(
  "operating_system_category",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    name: operatingSystemCategoryEnum("name").unique().notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
)

export const operatingSystemFamilyEnum = pgEnum("operating_system_family", [
  "ubuntu",
  "debian",
  "fedora",
  "centos",
  "windows",
  "windows server",
])

export const operatingSystemReleaseTable = createTable(
  "operating_system_release",
  (d) => ({
    categoryId: d.text("category_id").notNull(),
    codename: d.text("codename"),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    family: operatingSystemFamilyEnum("family").notNull(),
    id: d.text("id").primaryKey(),
    isLts: d.boolean("is_lts").default(false).notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    version: d.text("version").notNull(),
  }),
  (t) => [
    index("os_release_category_idx").on(t.categoryId),
    index("os_release_family_version_idx").on(t.family, t.version),
    unique("os_release_family_version_uniq").on(t.family, t.version),
    foreignKey({
      columns: [t.categoryId],
      foreignColumns: [operatingSystemCategoryTable.id],
      name: "os_release_category_fk",
    }),
  ],
)

export const operatingSystemStatusEnum = pgEnum("operating_system_status", [
  "active",
  "inactive",
  "deprecated",
])

export const operatingSystemTable = createTable(
  "operating_system",
  (d) => ({
    cloudInitEnabled: d.boolean("cloud_init_enabled").default(false).notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    name: d.text("name").notNull(),
    pveVmid: d.integer("pve_vmid").unique().notNull(),
    releaseId: d.text("release_id").notNull(),
    slug: d.text("slug").unique().notNull(),
    status: operatingSystemStatusEnum("status").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("operating_system_name_idx").on(t.name),
    index("operating_system_release_idx").on(t.releaseId),
    index("operating_system_pveVmid_idx").on(t.pveVmid),
    foreignKey({
      columns: [t.releaseId],
      foreignColumns: [operatingSystemReleaseTable.id],
      name: "os_release_fk",
    }).onDelete("restrict"),
  ],
)

export const resourcePlanStatusEnum = pgEnum("resource_plan_status", [
  "active",
  "inactive",
  "deprecated",
])

export const resourcePlanTable = createTable(
  "resource_plan",
  (d) => ({
    cores: d.integer("cores").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    description: d.text("description").notNull(),
    disk: d.integer("disk").notNull(),
    id: d.text("id").primaryKey(),
    memory: d.integer("memory").notNull(),
    name: d.text("name").notNull(),
    slug: d.text("slug").unique().notNull(),
    status: resourcePlanStatusEnum("status").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [index("resource_plan_slug_idx").on(t.slug)],
)

export const firewallRuleActionEnum = pgEnum("firewall_rule_action", [
  "ACCEPT",
  "DROP",
])
export const firewallRuleProtocolEnum = pgEnum("firewall_rule_protocol", [
  "tcp",
  "udp",
  "icmp",
  "any",
])
export const firewallRuleSourceTypeEnum = pgEnum("firewall_rule_source_type", [
  "cidr", // explicit sourceCidr, e.g. "203.0.113.4/32"
  "org", // owner's org IPSet, e.g. +org_9vv32...; sourceCidr must be null
  "any", // unrestricted, 0.0.0.0/0; sourceCidr must be null
])

export const instanceFirewallRuleTable = createTable(
  "instance_firewall_rule",
  (d) => ({
    action: firewallRuleActionEnum("action").notNull(),
    comment: d.text("comment"),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    enabled: d.boolean("enabled").default(true).notNull(),
    id: d.text("id").primaryKey(),
    instanceId: d
      .text("instance_id")
      .notNull()
      .references(() => instanceTable.id, { onDelete: "cascade" }),
    portRange: d.text("port_range"),
    priority: d.integer("priority").notNull(),
    protocol: firewallRuleProtocolEnum("protocol").notNull(),
    sourceCidr: d.text("source_cidr"),
    sourceType: firewallRuleSourceTypeEnum("source_type").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("instance_firewall_rule_instanceId_idx").on(t.instanceId),
    uniqueIndex("firewall_rule_instanceId_priority_idx").on(
      t.instanceId,
      t.priority,
    ),
    check(
      "source_cidr_matches_source_type",
      sql`(${t.sourceType} = 'cidr' AND ${t.sourceCidr} IS NOT NULL) OR (${t.sourceType} != 'cidr' AND ${t.sourceCidr} IS NULL)`,
    ),
  ],
)

export const firewallSyncStatusEnum = pgEnum("firewall_sync_status", [
  "pending",
  "synced",
  "failed",
])
export const instanceStatusEnum = pgEnum("instance_status", [
  "queued",
  "provisioning",
  "starting",
  "running",
  "stopping",
  "stopped",
  "restarting",
  "pending_deletion",
  "deleting",
  "deleted",
  "failed",
])

export const instanceTable = createTable(
  "instance",
  (d) => ({
    cores: d.integer("cores").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    deletedAt: d.timestamp("deleted_at"),
    disk: d.integer("disk").notNull(),
    firewallSyncError: d.text("firewall_sync_error"),
    firewallSyncedAt: d.timestamp("firewall_synced_at"),
    firewallSyncStatus: firewallSyncStatusEnum("firewall_sync_status")
      .default("synced")
      .notNull(),
    hostname: d.text("hostname").notNull(),
    id: d.text("id").primaryKey(),
    internetAccess: d.boolean("internet_access").default(true).notNull(),
    memory: d.integer("memory").notNull(),
    networkId: d
      .text("network_id")
      .notNull()
      .references(() => networkTable.id, { onDelete: "cascade" }),
    operatingSystemId: d
      .text("operating_system_id")
      .notNull()
      .references(() => operatingSystemTable.id, { onDelete: "restrict" }),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pveNode: d.text("pve_node").notNull(),
    pveVmid: d.integer("pve_vmid").unique().notNull(),
    resourcePlanId: d
      .text("resource_plan_id")
      .notNull()
      .references(() => resourcePlanTable.id, { onDelete: "restrict" }),
    status: instanceStatusEnum("status").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("instance_pveVmid_active_idx")
      .on(t.pveVmid)
      .where(isNull(t.deletedAt)),
    index("instance_hostname_idx").on(t.hostname),
    index("instance_organizationId_idx").on(t.organizationId),
    index("instance_pveNode_idx").on(t.pveNode),
    index("instance_pveVmid_idx").on(t.pveVmid),
    index("instance_resourcePlanId_idx").on(t.resourcePlanId),
  ],
)

export const instanceSSHKeyTable = createTable(
  "instance_ssh_key",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    instanceId: d
      .text("instance_id")
      .notNull()
      .references(() => instanceTable.id, { onDelete: "cascade" }),
    sshKeyId: d
      .text("ssh_key_id")
      .notNull()
      .references(() => sshKeyTable.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("instance_ssh_key_instanceId_idx").on(t.instanceId),
    index("instance_ssh_key_sshKeyId_idx").on(t.sshKeyId),
    uniqueIndex("instance_ssh_key_unique_idx").on(t.instanceId, t.sshKeyId),
  ],
)

export const ipAllocationTable = createTable(
  "ip_allocation",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    gateway: d.inet("gateway").notNull(),
    id: d.text("id").primaryKey(),
    instanceId: d
      .text("instance_id")
      .references(() => instanceTable.id, { onDelete: "set null" }),
    ipAddress: d.inet("ip_address").unique().notNull(),
    isPrimary: d.boolean("is_primary").default(false).notNull(),
    macAddress: d.macaddr("mac_address").unique(),
    networkId: d
      .text("network_id")
      .notNull()
      .references(() => networkTable.id, { onDelete: "restrict" }),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("ip_allocation_ipAddress_idx").on(t.ipAddress)],
)

export const networkTable = createTable("network", (d) => ({
  cidr: d.integer("cidr").default(24).notNull(),
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
  dhcpEnabled: d.boolean("dhcp_enabled").default(true).notNull(),
  dnsServers: d.text("dns_servers").array().notNull(),
  gateway: d.inet("gateway").notNull(),
  id: d.text("id").primaryKey(),
  name: d.text("name").unique().notNull(),
  network: d.inet("network").unique().notNull(),
  updatedAt: d
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  vlanId: d.integer("vlan_id").unique().notNull(),
}))

export const user = createTable(
  "user",
  (d) => ({
    banExpires: d.timestamp("ban_expires"),
    banned: d.boolean("banned").default(false),
    banReason: d.text("ban_reason"),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    defaultOrganizationId: d
      .text("default_organization_id")
      .references(() => organization.id, { onDelete: "set null" }),
    email: d.text("email").notNull().unique(),
    emailVerified: d.boolean("email_verified").default(false).notNull(),
    id: d.text("id").primaryKey(),
    image: d.text("image"),
    name: d.text("name").notNull(),
    role: d.text("role"),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("user_name_idx").on(t.name),
    index("user_email_idx").on(t.email),
    index("user_defaultOrganizationId_idx").on(t.defaultOrganizationId),
  ],
)

export const account = createTable(
  "account",
  (d) => ({
    accessToken: d.text("access_token"),
    accessTokenExpiresAt: d.timestamp("access_token_expires_at"),
    accountId: d.text("account_id").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    idToken: d.text("id_token"),
    issuer: d.text("issuer"),
    password: d.text("password"),
    providerId: d.text("provider_id").notNull(),
    refreshToken: d.text("refresh_token"),
    refreshTokenExpiresAt: d.timestamp("refresh_token_expires_at"),
    scope: d.text("scope"),
    updatedAt: d
      .timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [index("account_userId_idx").on(t.userId)],
)

export const verification = createTable(
  "verification",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    expiresAt: d.timestamp("expires_at").notNull(),
    id: d.text("id").primaryKey(),
    identifier: d.text("identifier").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    value: d.text("value").notNull(),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
)

export const organization = createTable(
  "organization",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    logo: d.text("logo"),
    metadata: d.text("metadata"),
    name: d.text("name").notNull(),
    slug: d.text("slug").notNull().unique(),
  }),
  (t) => [index("organization_slug_uidx").on(t.slug)],
)

export const member = createTable(
  "member",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: d.text("role").default("member").notNull(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("member_organizationId_idx").on(t.organizationId),
    index("member_userId_idx").on(t.userId),
  ],
)

export const invitation = createTable(
  "invitation",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    email: d.text("email").notNull(),
    expiresAt: d.timestamp("expires_at").notNull(),
    id: d.text("id").primaryKey(),
    inviterId: d
      .text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: d.text("role"),
    status: d.text("status").default("pending").notNull(),
  }),
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
)

export const apikey = createTable(
  "apikey",
  (d) => ({
    configId: d.text("config_id").default("default").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    enabled: d.boolean("enabled").default(true),
    expiresAt: d.timestamp("expires_at"),
    id: d.text("id").primaryKey(),
    key: d.text("key").notNull(),
    lastRefillAt: d.timestamp("last_refill_at"),
    lastRequest: d.timestamp("last_request"),
    metadata: d.text("metadata"),
    name: d.text("name"),
    permissions: d.text("permissions"),
    prefix: d.text("prefix"),
    rateLimitEnabled: d.boolean("rate_limit_enabled").default(true),
    rateLimitMax: d.integer("rate_limit_max").default(10),
    rateLimitTimeWindow: d.integer("rate_limit_time_window").default(86400000),
    referenceId: d.text("reference_id").notNull(),
    refillAmount: d.integer("refill_amount"),
    refillInterval: d.integer("refill_interval"),
    remaining: d.integer("remaining"),
    requestCount: d.integer("request_count").default(0),
    start: d.text("start"),
    updatedAt: d.timestamp("updated_at").notNull(),
  }),
  (t) => [
    index("apikey_configId_idx").on(t.configId),
    index("apikey_referenceId_idx").on(t.referenceId),
    index("apikey_key_idx").on(t.key),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  invitations: many(invitation),
  members: many(member),
  sshKeys: many(sshKeyTable),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const organizationRelations = relations(organization, ({ many }) => ({
  invitations: many(invitation),
  members: many(member),
}))

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}))

export const sshKeyRelations = relations(sshKeyTable, ({ one, many }) => ({
  instanceSSHKeys: many(instanceSSHKeyTable),
  organization: one(organization, {
    fields: [sshKeyTable.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [sshKeyTable.userId],
    references: [user.id],
  }),
}))

export const instanceRelations = relations(instanceTable, ({ one, many }) => ({
  instanceSSHKeys: many(instanceSSHKeyTable),
  ipAllocations: many(ipAllocationTable),
  network: one(networkTable, {
    fields: [instanceTable.networkId],
    references: [networkTable.id],
  }),
  operatingSystem: one(operatingSystemTable, {
    fields: [instanceTable.operatingSystemId],
    references: [operatingSystemTable.id],
  }),
  organization: one(organization, {
    fields: [instanceTable.organizationId],
    references: [organization.id],
  }),
  resourcePlan: one(resourcePlanTable, {
    fields: [instanceTable.resourcePlanId],
    references: [resourcePlanTable.id],
  }),
  sshKeys: many(instanceSSHKeyTable),
}))

export const instanceSSHKeyRelations = relations(
  instanceSSHKeyTable,
  ({ one }) => ({
    instance: one(instanceTable, {
      fields: [instanceSSHKeyTable.instanceId],
      references: [instanceTable.id],
    }),
    sshKey: one(sshKeyTable, {
      fields: [instanceSSHKeyTable.sshKeyId],
      references: [sshKeyTable.id],
    }),
  }),
)

export const operatingSystemCategoryRelations = relations(
  operatingSystemCategoryTable,
  ({ many }) => ({
    releases: many(operatingSystemReleaseTable),
  }),
)

export const operatingSystemReleaseRelations = relations(
  operatingSystemReleaseTable,
  ({ one, many }) => ({
    category: one(operatingSystemCategoryTable, {
      fields: [operatingSystemReleaseTable.categoryId],
      references: [operatingSystemCategoryTable.id],
    }),
    operatingSystems: many(operatingSystemTable),
  }),
)

export const operatingSystemRelations = relations(
  operatingSystemTable,
  ({ one }) => ({
    release: one(operatingSystemReleaseTable, {
      fields: [operatingSystemTable.releaseId],
      references: [operatingSystemReleaseTable.id],
    }),
  }),
)

export const resourcePlanRelations = relations(
  resourcePlanTable,
  ({ many }) => ({
    instances: many(instanceTable),
  }),
)

export const ipAllocationRelations = relations(
  ipAllocationTable,
  ({ one }) => ({
    instance: one(instanceTable, {
      fields: [ipAllocationTable.instanceId],
      references: [instanceTable.id],
    }),
    network: one(networkTable, {
      fields: [ipAllocationTable.networkId],
      references: [networkTable.id],
    }),
  }),
)

export const networkRelations = relations(networkTable, ({ many }) => ({
  instances: many(instanceTable),
  ipAllocations: many(ipAllocationTable),
}))

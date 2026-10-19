import { apiKey } from "@better-auth/api-key"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { admin, genericOAuth, organization } from "better-auth/plugins"
import { eq } from "drizzle-orm"

import { APP_NAME } from "@/constants/app"
import {
  GLOBAL_API_KEY_CONFIG_ID,
  GLOBAL_API_KEY_HEADERS,
  GLOBAL_API_KEY_PREFIX,
} from "@/constants/auth"
import { env } from "@/env"
import { getRedisClient } from "@/lib/redis"
import { ac, adminRole, memberRole } from "@/server/auth/ac"
import { db } from "@/server/db"
import { user as userTable } from "@/server/db/schema"
import {
  getInitialOrganizationId,
  getInitialOrganizationSlug,
} from "@/server/queries/organization"
import { logActivity } from "@/server/services/activity"

const incrementScript = `
local value = redis.call("INCR", KEYS[1])
if value == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return value
`

export const auth = betterAuth({
  account: { encryptOAuthTokens: true },
  appName: APP_NAME,
  baseURL: env.NEXT_PUBLIC_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const orgId = await getInitialOrganizationId(session.userId)
          return {
            data: { ...session, activeOrganizationId: orgId },
          }
        },
      },
    },
    user: {
      create: {
        async after(user) {
          try {
            const userCount = await db.$count(userTable)
            const isFirstUser = userCount === 1

            const safeSlug = getInitialOrganizationSlug(user)

            const org = await auth.api.createOrganization({
              body: {
                name: `${user.name}'s Organization`,
                slug: safeSlug,
                userId: user.id,
              },
            })

            await db
              .update(userTable)
              .set({
                defaultOrganizationId: org.id,
                ...(isFirstUser && { role: "admin" }),
              })
              .where(eq(userTable.id, user.id))
          } catch (error) {
            console.error(
              `Post-registration workspace setup failed for user ${user.id}:`,
              error,
            )
            throw new Error(
              "Failed to initialize user organization environment.",
            )
          }
        },
      },
    },
  },
  emailAndPassword: { enabled: false },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/callback")) {
        const newSession = ctx.context.newSession
        if (newSession) {
          await logActivity(db, "user_logged_in", {
            actorId: newSession.user.id,
            actorSnapshot: newSession.user,
            actorType: "user",
            channel: "api",
            metadata: {},
            organizationId: newSession.session.activeOrganizationId ?? null,
            referenceId: newSession.user.id,
            referenceType: "user",
          })
        }
      }
    }),
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-out") {
        const session = await getSessionFromCtx(ctx, { disableRefresh: true })
        if (session) {
          await logActivity(db, "user_logged_out", {
            actorId: session.user.id,
            actorSnapshot: session.user,
            actorType: "user",
            channel: "api",
            metadata: {},
            organizationId: session.session.activeOrganizationId,
            referenceId: session.user.id,
            referenceType: "user",
          })
        }
      }
    }),
  },
  plugins: [
    admin(),
    genericOAuth({
      config: [
        {
          clientId: env.OAUTH_CLIENT_ID,
          clientSecret: env.OAUTH_CLIENT_SECRET,
          discoveryUrl: env.OAUTH_DISCOVERY_URL,
          mapProfileToUser(profile) {
            return {
              image:
                typeof profile.picture === "string"
                  ? profile.picture
                  : undefined,
            }
          },
          overrideUserInfo: true,
          providerId: env.NEXT_PUBLIC_OAUTH_PROVIDER_ID,
          scopes: ["openid", "email", "profile"],
        },
      ],
    }),
    organization({
      ac,
      roles: {
        admin: adminRole,
        member: memberRole,
      },
    }),
    apiKey({
      apiKeyHeaders: GLOBAL_API_KEY_HEADERS,
      configId: GLOBAL_API_KEY_CONFIG_ID,
      defaultPrefix: GLOBAL_API_KEY_PREFIX,
      enableMetadata: true,
      fallbackToDatabase: true,
      rateLimit: {
        enabled: env.NODE_ENV === "production",
        maxRequests: 100,
        timeWindow: 1000 * 60 * 60 * 24,
      },
      references: "organization",
      storage: "secondary-storage",
    }),
    nextCookies(),
  ],
  rateLimit: { storage: "secondary-storage" },
  secondaryStorage: {
    delete: async (key) => {
      await getRedisClient().del(key)
    },
    get: async (key) => {
      return await getRedisClient().get(key)
    },
    getAndDelete: async (key) => {
      return await getRedisClient().getDel(key)
    },
    increment: async (key, ttl) => {
      const value = await getRedisClient().eval(incrementScript, {
        arguments: [String(ttl)],
        keys: [key],
      })
      return Number(value)
    },
    set: async (key, value, ttl) => {
      if (ttl) await getRedisClient().set(key, value, { EX: ttl })
      else await getRedisClient().set(key, value)
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      defaultOrganizationId: {
        index: true,
        references: {
          field: "id",
          model: "organization",
          onDelete: "set null",
        },
        type: "string",
      },
    },
  },
})

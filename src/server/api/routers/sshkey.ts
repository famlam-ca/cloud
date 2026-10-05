import { randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import * as z from "zod"

import {
  generateSSHKeySchema,
  importSSHKeySchema,
  selectSSHKeySchema,
} from "@/schemas/ssh-key"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { sshKeyTable } from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"
import { logActivity } from "@/server/services/activity"
import type { ParsedSSHPublicKey } from "@/server/services/ssh-key"
import {
  buildEd25519PublicKeyBlob,
  buildOpenSSHEd25519PrivateKey,
  buildOpenSSHRSAPrivateKey,
  buildRSAPublicKeyBlob,
  fingerprintSSHPublicKey,
  formatSSHKeyName,
  formatSSHPublicKey,
  generateEd25519KeyPair,
  generateRsaKeyPair,
  parseSSHPublicKey,
} from "@/server/services/ssh-key"

export const sshKeyRouter = createTRPCRouter({
  delete: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "DELETE",
          path: "/sshkey/{id}",
          summary: "Delete an SSH key",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [sshKey] = await ctx.db
        .delete(sshKeyTable)
        .where(
          and(
            eq(sshKeyTable.id, input.id),
            eq(sshKeyTable.organizationId, ctx.organizationId),
          ),
        )
        .returning()

      if (!sshKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SSH key not found",
        })
      }

      await logActivity(ctx.db, "ssh_key_deleted", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: {},
        organizationId: ctx.organizationId,
        referenceId: sshKey.id,
        referenceType: "ssh_key",
      })

      return { success: true }
    }),

  generate: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/sshkey/generate",
          summary: "Generate a new SSH key",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .input(generateSSHKeySchema)
    .output(z.object({ ...selectSSHKeySchema.shape, privateKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const name = formatSSHKeyName(input.name)

      let publicKeyString: string
      let fingerprint: string
      let privateKeyPem: string

      if (input.type === "ed25519") {
        const { privateKey, publicKey } = await generateEd25519KeyPair()

        const jwkPub = publicKey.export({ format: "jwk" })
        if (!jwkPub.x) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid public JWK",
          })
        }
        const pubKeyBuffer = Buffer.from(jwkPub.x, "base64url")

        const blob = buildEd25519PublicKeyBlob(pubKeyBuffer)
        publicKeyString = formatSSHPublicKey("ssh-ed25519", blob, name)
        fingerprint = fingerprintSSHPublicKey(blob)

        const jwkPriv = privateKey.export({ format: "jwk" })
        if (!jwkPriv.d) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid private JWK",
          })
        }
        const privateKeySeed = Buffer.from(jwkPriv.d, "base64url")

        privateKeyPem = buildOpenSSHEd25519PrivateKey(
          pubKeyBuffer,
          privateKeySeed,
          name,
        )
      } else {
        const { privateKey, publicKey } = await generateRsaKeyPair(4096)

        const jwkPub = publicKey.export({ format: "jwk" })
        if (!jwkPub.n || !jwkPub.e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid public JWK",
          })
        }
        const nBuf = Buffer.from(jwkPub.n, "base64url")
        const eBuf = Buffer.from(jwkPub.e, "base64url")

        const blob = buildRSAPublicKeyBlob(nBuf, eBuf)
        publicKeyString = formatSSHPublicKey("ssh-rsa", blob, name)
        fingerprint = fingerprintSSHPublicKey(blob)

        const jwkPriv = privateKey.export({ format: "jwk" })
        if (!jwkPriv.d || !jwkPriv.p || !jwkPriv.q || !jwkPriv.qi) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid private JWK",
          })
        }
        const dBuf = Buffer.from(jwkPriv.d, "base64url")
        const pBuf = Buffer.from(jwkPriv.p, "base64url")
        const qBuf = Buffer.from(jwkPriv.q, "base64url")
        const iqmpBuf = Buffer.from(jwkPriv.qi, "base64url")

        privateKeyPem = buildOpenSSHRSAPrivateKey(
          nBuf,
          eBuf,
          dBuf,
          pBuf,
          qBuf,
          iqmpBuf,
          name,
        )
      }

      try {
        const [sshKey] = await ctx.db
          .insert(sshKeyTable)
          .values({
            comment: input.comment,
            fingerprint,
            id: randomUUID(),
            name,
            organizationId: ctx.organizationId,
            publicKey: publicKeyString,
            type: input.type,
            userId: ctx.session.session.userId,
          })
          .returning()

        await logActivity(ctx.db, "ssh_key_generated", {
          actorId: ctx.session.session.userId,
          actorSnapshot: ctx.session.user,
          actorType: "user",
          channel: "api",
          metadata: {},
          organizationId: ctx.organizationId,
          referenceId: sshKey.id,
          referenceType: "ssh_key",
        })

        return {
          ...sshKey,
          privateKey: privateKeyPem,
        }
      } catch (error) {
        if (isUniqueConstraintError(error, "ssh_key_name_idx")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "SSH key name already exists",
          })
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        })
      }
    }),

  import: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/sshkey/import",
          summary: "Import an existing SSH key",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .input(importSSHKeySchema)
    .output(selectSSHKeySchema)
    .mutation(async ({ ctx, input }) => {
      const name = formatSSHKeyName(input.name)

      let parsed: ParsedSSHPublicKey
      try {
        parsed = parseSSHPublicKey(input.publicKey)
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Invalid public key",
        })
      }

      try {
        const [sshKey] = await ctx.db
          .insert(sshKeyTable)
          .values({
            comment: input.comment || parsed.comment || null,
            fingerprint: parsed.fingerprint,
            id: randomUUID(),
            name,
            organizationId: ctx.organizationId,
            publicKey: parsed.publicKeyString,
            type: parsed.type,
            userId: ctx.session.session.userId,
          })
          .returning()

        await logActivity(ctx.db, "ssh_key_imported", {
          actorId: ctx.session.session.userId,
          actorSnapshot: ctx.session.user,
          actorType: "user",
          channel: "api",
          metadata: {},
          organizationId: ctx.organizationId,
          referenceId: sshKey.id,
          referenceType: "ssh_key",
        })

        return sshKey
      } catch (error) {
        if (isUniqueConstraintError(error, "ssh_key_name_idx")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "SSH key name already exists",
          })
        }
        if (isUniqueConstraintError(error, "ssh_key_fingerprint_idx")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "SSH key already exists",
          })
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        })
      }
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/sshkeys",
          summary: "List all SSH keys for the active organization",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .output(z.array(selectSSHKeySchema))
    .query(async ({ ctx }) => {
      const sshKeys = await ctx.db.query.sshKeyTable.findMany({
        where: (sshKey, { eq }) =>
          eq(sshKey.organizationId, ctx.organizationId),
      })

      return sshKeys
    }),
})

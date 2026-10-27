import { apiKeyClient } from "@better-auth/api-key/client"
import {
  adminClient,
  inferAdditionalFields,
  inferOrgAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { env } from "@/env"
import type { auth } from "@/server/auth"

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_URL,
  plugins: [
    adminClient(),
    inferAdditionalFields<typeof auth>(),
    organizationClient({ schema: inferOrgAdditionalFields<typeof auth>() }),
    apiKeyClient(),
  ],
})

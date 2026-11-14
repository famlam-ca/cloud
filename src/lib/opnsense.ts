import * as axios from "axios"
import * as https from "node:https"

import { env } from "@/env"

export const opnsenseClient = axios.create({
  auth: {
    // TODO: use dedicated user with limited permissions; currently using root
    password: env.OPNSENSE_API_SECRET,
    username: env.OPNSENSE_API_KEY,
  },
  baseURL: env.OPNSENSE_API_ENDPOINT,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
})

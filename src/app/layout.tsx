import { cn } from "cn"
import type { Metadata } from "next"
import { Roboto_Mono, Source_Code_Pro, Space_Grotesk } from "next/font/google"

import { ThemeProvider } from "@/components/providers/theme"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { APP_DESCRIPTION, APP_NAME } from "@/constants/app"
import { TRPCReactProvider } from "@/lib/api/client"

import "@/styles/globals.css"

const sourceCodePro = Source_Code_Pro({
  subsets: [
    "latin",
    "latin-ext",
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "greek-ext",
    "vietnamese",
  ],
  variable: "--font-source-code-pro",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
})

const robotoMono = Roboto_Mono({
  subsets: [
    "latin",
    "latin-ext",
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "vietnamese",
  ],
  variable: "--font-roboto-mono",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={cn(
        "antialiased",
        sourceCodePro.variable,
        spaceGrotesk.variable,
        robotoMono.variable,
      )}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <meta content={APP_NAME} name="apple-mobile-web-app-title" />
      </head>
      <body>
        <TRPCReactProvider>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors />
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  )
}

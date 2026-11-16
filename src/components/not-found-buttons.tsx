"use client"

import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function NotFoundButtons() {
  const router = useRouter()

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button onClick={() => router.back()} size="lg">
        <IconArrowLeft /> Go back
      </Button>
      <Button render={<Link href="/" />} size="lg" variant="secondary">
        Return home
      </Button>
    </div>
  )
}

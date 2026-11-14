import { cn } from "cn"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface InfiniteScrollProps {
  className?: string
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isManual?: boolean
}

export function InfiniteScroll({
  className,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isManual = false,
}: InfiniteScrollProps) {
  const { isIntersecting, targetRef } = useIntersectionObserver({
    rootMargin: "100px",
    threshold: 0.5,
  })

  React.useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
      fetchNextPage()
    }
  }, [isIntersecting, fetchNextPage, hasNextPage, isFetchingNextPage, isManual])

  return (
    <div className={cn("flex flex-col items-center gap-4 p-4", className)}>
      <div className="h-1" ref={targetRef}>
        {hasNextPage && !isManual ? (
          <div className="flex items-center justify-center">
            <Spinner className="text-muted-foreground size-7" />
          </div>
        ) : hasNextPage && isManual ? (
          <Button
            disabled={!hasNextPage || isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="secondary"
          >
            {isFetchingNextPage ? (
              <>
                <Spinner />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

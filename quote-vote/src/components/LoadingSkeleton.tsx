import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

// A single skeleton card that mimics the layout of a QuoteCard
const SkeletonCard = () => {
  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-grow space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </CardFooter>
    </Card>
  )
}

// The main skeleton component that renders a grid of skeleton cards.
// It mimics the structure of the page when content is loaded.
export const LoadingSkeleton = () => {
  return (
    <>
      {/* Skeleton for "Featured Quotes" section */}
      <div className="mb-12">
        <Skeleton className="h-8 w-1/2 max-w-xs mx-auto mb-6" />
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (<SkeletonCard key={`featured-skel-${index}`} />))}
        </div>
      </div>

      {/* Skeleton for "Vote your favorite quotes!" section */}
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (<SkeletonCard key={`main-skel-${index}`} />))}
      </div>
    </>
  )
}
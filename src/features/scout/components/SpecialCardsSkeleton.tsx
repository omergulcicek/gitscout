import { Skeleton } from "@/components/ui/skeleton"
import * as m from "@/paraglide/messages.js"

const OCCASION_COUNT = 6

/**
 * Özel kartlar sayfası yüklenirken gösterilir. Yerleşim `SpecialCardsPage` ile aynı: başlık ve açıklama,
 * altında üç sütunlu ızgarada kart, indir/kopyala düğmeleri, kartın adı ve iki bilgi satırı.
 */
export function SpecialCardsSkeleton() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      aria-busy="true"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 overflow-x-clip px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <p role="status" className="sr-only">
        {m.page_loading()}
      </p>

      <div aria-hidden className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <Skeleton className="h-9 w-56 sm:h-10" />
        <div className="flex max-w-3xl flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>

      <ul
        aria-hidden
        className="grid justify-items-center gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3"
      >
        {Array.from({ length: OCCASION_COUNT }, (_item, index) => (
          <li key={index} className="flex w-full max-w-80 flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-120 w-80 max-w-full rounded-[28px]" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <div className="flex w-full flex-col gap-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

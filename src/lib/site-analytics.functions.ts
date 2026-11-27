import { createServerFn } from "@tanstack/react-start"
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server"
import { z } from "zod"

import { analyticsEventSchema, pagePathSchema } from "@/schemas/analytics.schema"

import { getDb } from "@/lib/db"
import { ipBucket } from "@/helpers/ip-bucket"
import { isBot } from "@/helpers/is-bot"

/**
 * Yerel geliştirme canlı veritabanına bağlı ve satırlar silinemiyor; yerel gezinti sayaçlara yazılmaz.
 */
const PERSIST = !import.meta.env.DEV

type Visitor = { ip: string; userAgent: string }

/**
 * Ziyaretçiyi tanımak için IP ve tarayıcı bilgisi. Ham hâlleri hiçbir yere yazılmaz: veritabanı
 * fonksiyonu bunları günlük tuzla hash'leyip yalnızca o gün için tekilleştirmede kullanır.
 * Botlar ve yerel geliştirme için `null` döner, kayıt yapılmaz.
 */
function countableVisitor(): Visitor | null {
  if (!PERSIST) return null
  const userAgent = getRequestHeader("user-agent")
  if (!userAgent || isBot(userAgent)) return null
  // Vercel X-Forwarded-For başlığını kendisi yazar; istemcinin gönderdiği değer kullanılmaz.
  // IPv6 is counted per /64 block: one connection can rotate freely inside it.
  const ip = ipBucket(getRequestIP({ xForwardedFor: true }))
  return { ip, userAgent: userAgent.slice(0, 512) }
}

/**
 * Sayfa görüntülemesini Supabase'e yazar (`source = 'site'`). Aynı kişi aynı yolu, profili ya da
 * kapışmayı UTC günü başına bir kez sayar; uygulama rolü tablolara doğrudan yazamaz.
 */
export const recordPageView = createServerFn({ method: "POST" })
  .validator(z.object({ path: pagePathSchema }))
  .handler(async ({ data }) => {
    const visitor = countableVisitor()
    if (!visitor) return
    const sql = getDb()
    await sql`select gitscout.record_page_view(${data.path}, ${visitor.ip}, ${visitor.userAgent})`
  })

/** Özel olayı Supabase'e yazar; aynı kişinin aynı olayı aynı veriyle günde bir kez sayılır. */
export const recordEvent = createServerFn({ method: "POST" })
  .validator(analyticsEventSchema)
  .handler(async ({ data: { name, ...properties } }) => {
    const visitor = countableVisitor()
    if (!visitor) return
    const sql = getDb()
    await sql`select gitscout.record_event(${name}, ${sql.json(properties)}, ${visitor.ip}, ${visitor.userAgent})`
  })

import { siteConfig } from "@/config/site.config"

import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

const OG_LOCALES: Record<Locale, string> = { en: "en_US", tr: "tr_TR" }

/** Site geneli önizleme görselinin metni dile göre değişir; İngilizce olan varsayılan `og.png`. */
const OG_IMAGES: Record<Locale, string> = {
  en: siteConfig.ogImage,
  tr: siteConfig.ogImage.replace(/og\.png$/, "og-tr.png")
}

/** Shared SEO fields used by the root route `head()` and social meta tags. */
const defaultSeo = {
  title: siteConfig.name,
  titleTemplate: `%s · ${siteConfig.name}`,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    title: siteConfig.name,
    siteName: siteConfig.name,
    images: [{ width: 1200, height: 630, alt: siteConfig.name }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name
  }
} as const

/** Pages with their own static preview image in `public/og-pages/`, one file per locale. */
export type PageOgImage = "about" | "leaderboard" | "login" | "settings" | "special-cards" | "vs"

function pageOgImage(page: PageOgImage): string {
  const suffix = getLocale() === "tr" ? "-tr" : ""
  return `${siteConfig.url}/og-pages/${page}${suffix}.jpg`
}

/**
 * A page's own title and description, also used for its social previews. With `image`, the page's
 * own preview replaces the site-wide one from the root route.
 */
export function pageMeta(title: string, description?: string, image?: PageOgImage) {
  const imageUrl = image ? pageOgImage(image) : undefined
  return [
    { title },
    { property: "og:title", content: title },
    { name: "twitter:title", content: title },
    ...(description
      ? [
          { name: "description", content: description },
          { property: "og:description", content: description },
          { name: "twitter:description", content: description }
        ]
      : []),
    ...(imageUrl
      ? [
          { property: "og:image", content: imageUrl },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { name: "twitter:image", content: imageUrl }
        ]
      : [])
  ]
}

/** Flatten `defaultSeo` into TanStack Router `head().meta` entries. */
export function seoHeadMeta() {
  const og = defaultSeo.openGraph
  const twitter = defaultSeo.twitter
  const description = m.site_description()
  const image = OG_IMAGES[getLocale()]

  return [
    { title: defaultSeo.title },
    { name: "description", content: description },
    { name: "author", content: defaultSeo.creator },
    { name: "creator", content: defaultSeo.creator },
    { property: "og:type", content: og.type },
    { property: "og:locale", content: OG_LOCALES[getLocale()] },
    { property: "og:title", content: og.title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: og.siteName },
    { property: "og:image", content: image },
    { name: "twitter:card", content: twitter.card },
    { name: "twitter:title", content: twitter.title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ]
}

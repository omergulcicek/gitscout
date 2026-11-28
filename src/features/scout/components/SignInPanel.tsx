import { Link } from "@tanstack/react-router"
import { BadgeCheck, Cake, Flag, Lock, ShieldCheck, ShieldHalf, Users } from "lucide-react"
import { cn } from "cn"

import { ACCOUNT_ELIGIBILITY } from "@/constants/account.constants"

import { getLangParam } from "@/helpers/localized-url"

import { useStartGithubLogin, useViewer } from "@/hooks/use-viewer"

import { GithubMark } from "@/components/shared/GithubMark"
import { Button, buttonVariants } from "@/components/ui/button"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/** Kartın gerçek boyutu; görseller 2x çözünürlükte. */
const CARD = { width: 320, height: 480 } as const
/**
 * Elde açılmış kartlar gibi: yan kartlar ortadakinden yana kayar ve alt ortalarının etrafında döner,
 * ortadaki kart biraz yukarıda durur. Böylece üç kartın da üst kısmı görünür, boyları eşit kalır.
 */
const FAN_ANGLE = 14
const FAN_SHIFT = 150
const FAN_LIFT = 18
/** Açılan kartların kapladığı alan (yaklaşık), yazıyla çakışmasın diye ayrılır. */
const FAN_BOX = { width: 860, height: 600 }

/**
 * Yelpazedeki üç özel kart: solda yılbaşı, sağda Programcılar Günü, önde ortada doğum günü. Sitenin sahibinin
 * kartlarının önceden çekilmiş görselleri; sayfa veri beklemez, dile göre etiketli görsel seçilir.
 */
function CardFan() {
  const locale = getLocale()
  const fan = [
    { occasion: "new-year", rotate: -FAN_ANGLE, x: -FAN_SHIFT, y: 0, rarity: "gold" },
    { occasion: "programmers-day", rotate: FAN_ANGLE, x: FAN_SHIFT, y: 0, rarity: "gold" },
    // Ortadaki kart en önde: iki yan kart arkada eşit kalır, yelpaze iki yana simetrik açılır.
    { occasion: "birthday", rotate: 0, x: 0, y: -FAN_LIFT, rarity: "icon" }
  ] as const

  return (
    <div aria-hidden className="relative" style={FAN_BOX}>
      <div
        data-rarity="icon"
        className="scout-card-glow pointer-events-none absolute inset-x-24 inset-y-10"
      />
      {fan.map(({ occasion, rotate, x, y, rarity }) => (
        <div
          key={occasion}
          data-rarity={rarity}
          className="absolute bottom-6 left-1/2"
          style={{
            ...CARD,
            translate: `calc(-50% + ${x}px) ${y}px`,
            rotate: `${rotate}deg`,
            transformOrigin: "50% 100%"
          }}
        >
          <img
            src={`/cards/${locale}/${occasion}.webp`}
            alt=""
            width={CARD.width}
            height={CARD.height}
            loading="eager"
            className="drop-shadow-[0_18px_30px_rgb(0_0_0/0.55)]"
          />
        </div>
      ))}
    </div>
  )
}

/** Dağınık düzenin kapladığı alan; kartlar bu kutunun içinde serbestçe konumlanır. */
const SCATTER_BOX = { width: 980, height: 1180 }

/**
 * Masaüstündeki dağınık düzen: beş kart sağ alana masaya atılmış gibi yayılır; köşelerde dört kart,
 * ortada ve en önde doğum günü. Beşinci kart dile göre: Türkçede Cumhuriyet Bayramı, İngilizcede Kadınlar Günü.
 */
function ScatteredCards() {
  const locale = getLocale()
  const cards = [
    { occasion: "new-year", left: 30, top: 30, rotate: -11, rarity: "gold" },
    { occasion: "halloween", left: 590, top: 0, rotate: 9, rarity: "gold" },
    { occasion: "programmers-day", left: 10, top: 660, rotate: 7, rarity: "gold" },
    {
      occasion: locale === "tr" ? "republic-day" : "womens-day",
      left: 640,
      top: 670,
      rotate: -8,
      rarity: "gold"
    },
    { occasion: "birthday", left: 300, top: 340, rotate: -3, rarity: "icon" }
  ] as const

  return (
    <div aria-hidden className="relative" style={SCATTER_BOX}>
      {cards.map(({ occasion, left, top, rotate, rarity }) => (
        <div
          key={occasion}
          data-rarity={rarity}
          className="absolute"
          style={{ ...CARD, left, top, rotate: `${rotate}deg` }}
        >
          {occasion === "birthday" ? (
            <div className="scout-card-glow pointer-events-none absolute -inset-8" />
          ) : null}
          <img
            src={`/cards/${locale}/${occasion}.webp`}
            alt=""
            width={CARD.width}
            height={CARD.height}
            loading="eager"
            className="relative drop-shadow-[0_24px_36px_rgb(0_0_0/0.6)]"
          />
        </div>
      ))}
    </div>
  )
}

type SignInPanelProps = {
  title: string
  /** Sayfanın ana başlığıysa `h1`; sayfanın kendi başlığı varsa `h2`. */
  headingLevel?: "h1" | "h2"
  lead: string
  /** Geri dönüşte giriş tamamlanamadıysa. */
  failed?: boolean
}

/**
 * Giriş yapmamış kişiye girişin ne kazandırdığını kartlarla gösteren alan: giriş sayfası ve oturumsuz
 * ayarlar sayfası kullanır. Örnek kartlar statik görseldir, sayfa hiçbir veri beklemez.
 */
export function SignInPanel({
  title,
  headingLevel = "h2",
  lead,
  failed = false
}: SignInPanelProps) {
  const Heading = headingLevel
  const lang = getLangParam()
  const { data: viewer } = useViewer()
  const start = useStartGithubLogin()
  const showError = failed || start.isError

  const benefits = [
    {
      id: "verified",
      icon: BadgeCheck,
      tint: "bg-verified/12 text-verified",
      title: m.login_benefit_verified_title(),
      text: m.login_benefit_verified()
    },
    {
      id: "team-card",
      icon: ShieldHalf,
      tint: "bg-chart-away/15 text-chart-away",
      title: m.login_benefit_team_card_title(),
      text: m.login_benefit_team_card()
    },
    {
      id: "country",
      icon: Flag,
      tint: "bg-destructive/12 text-destructive",
      title: m.login_benefit_country_title(),
      text: m.login_benefit_country()
    },
    {
      id: "birthday",
      icon: Cake,
      tint: "bg-github-star/15 text-github-star",
      title: m.login_benefit_birthday_title(),
      text: m.login_benefit_birthday()
    },
    {
      id: "dream-team",
      icon: Users,
      tint: "bg-success/12 text-success",
      title: m.login_benefit_dream_team_title(),
      text: m.login_benefit_dream_team()
    }
  ]

  return (
    // Kartlar akışın dışında, sağ üstte: yazı sütununu daraltmaz, geniş ekranda kapsayıcının dışına taşar.
    <div className="relative flex flex-col gap-8 md:block">
      <div className="order-2 flex flex-col gap-6 md:max-w-sm lg:max-w-md xl:max-w-lg">
        <div className="flex flex-col gap-3">
          <Heading className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {title}
          </Heading>
          <p className="font-mono text-sm text-pretty text-muted-foreground">{lead}</p>
        </div>

        {showError ? (
          <p role="alert" className="text-sm text-destructive">
            {m.login_failed()}
          </p>
        ) : null}

        {/* Asıl eylem açıklamanın hemen altında: sayfa açılır açılmaz görünür, maddeler onun gerekçesi olur. */}
        <div>
          {viewer ? (
            <Link
              to="/{-$lang}/u/$username"
              params={{ lang, username: viewer.login }}
              className={buttonVariants({ size: "lg", className: "w-full sm:w-fit" })}
            >
              {m.login_go_to_profile()}
            </Link>
          ) : (
            <Button
              size="lg"
              className="w-full sm:w-fit"
              disabled={start.isPending || start.isSuccess}
              onClick={() => start.mutate()}
            >
              <GithubMark />
              {m.login_continue_github()}
            </Button>
          )}
        </div>

        <div className="@container flex flex-col gap-3">
          <p className="text-sm font-semibold">{m.login_benefits_heading()}</p>
          <ul className="grid gap-x-6 gap-y-4 @md:grid-cols-2">
            {benefits.map(({ id, icon: Icon, tint, title: benefitTitle, text }) => (
              <li key={id} className="flex items-start gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    tint
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{benefitTitle}</span>
                  <span className="text-pretty text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Both notes share one layout: icon, then text, balanced so no line ends with a lone word. */}
        <ul className="flex flex-col gap-2.5 border-t pt-5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0" />
            <span className="text-balance">
              {m.login_eligibility({
                months: ACCOUNT_ELIGIBILITY.minAgeMonths
              })}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Lock aria-hidden className="mt-px size-3.5 shrink-0" />
            <span className="text-balance">{m.login_privacy()}</span>
          </li>
        </ul>
      </div>

      {/* Telefonda yazının üstünde yelpaze; masaüstünde sağ sütuna dağılmış kartlar, yazının boyunca. */}
      <div className="pointer-events-none order-1 flex [zoom:0.41] justify-center md:hidden">
        <CardFan />
      </div>
      <div className="pointer-events-none absolute -top-6 right-0 hidden md:block md:[zoom:0.36] lg:[zoom:0.45] xl:-right-16 xl:[zoom:0.48]">
        <ScatteredCards />
      </div>
    </div>
  )
}

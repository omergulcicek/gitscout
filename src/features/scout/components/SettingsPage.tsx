import { useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { IdCard } from "lucide-react"
import { cn } from "cn"
import { useWatch } from "react-hook-form"

import { ACCOUNT_ELIGIBILITY } from "@/constants/account.constants"
import type { Gender, CardFace as ProfileCardFace } from "@/constants/account.constants"
import type { Team } from "@/constants/team.constants"

import { useViewer } from "@/hooks/use-viewer"

import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { playerQueryOptions } from "@/features/scout/api/players.queries"
import { CardOccasionPicker } from "@/features/scout/components/CardOccasionPicker"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { ProfileForm } from "@/features/scout/components/ProfileForm"
import { ReadmeBadgeSection } from "@/features/scout/components/ReadmeBadgeSection"
import { SettingsSkeleton } from "@/features/scout/components/SettingsSkeleton"
import { SignInPanel } from "@/features/scout/components/SignInPanel"
import { VerifiedIcon } from "@/features/scout/components/VerifiedIcon"
import { COUNTRIES } from "@/features/scout/constants/player-country.constants"
import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { BIRTHDAY_OVR } from "@/features/scout/helpers/birthday"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { playerCountry } from "@/features/scout/helpers/player-country"
import { useProfileForm } from "@/features/scout/hooks/use-profile-form"
import type { CardOccasion } from "@/features/scout/types/card-preview.types"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/**
 * Giriş yapan kişinin ayarları. Görünürlük yalnızca arayüz içindir: kaydetme isteğinde kim olduğu
 * ve onay durumu sunucuda oturumdan yeniden okunur. Yeni ayarlar buraya bölüm olarak eklenir.
 */
export function SettingsPage() {
  const { data: viewer, isPending } = useViewer()
  const country = COUNTRIES.find((code) => code === viewer?.country)

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      {/* Giriş yapılmamışken sayfanın ana başlığını giriş tanıtımı verir; iki başlık üst üste binmez. */}
      <PageHeader title={m.settings_title()} className={cn(!isPending && !viewer && "sr-only")}>
        {viewer ? (
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
              @{viewer.login}
              {viewer.eligible ? <VerifiedIcon /> : null}
            </p>
            {viewer.verifiedAt ? (
              <p className="text-xs text-balance text-muted-foreground">
                {m.settings_verified_since({
                  date: new Intl.DateTimeFormat(getLocale(), { dateStyle: "long" }).format(
                    new Date(viewer.verifiedAt)
                  )
                })}
              </p>
            ) : null}
          </div>
        ) : null}
      </PageHeader>

      {isPending ? (
        <SettingsSkeleton />
      ) : !viewer ? (
        <div className="pt-4">
          <SignInPanel title={m.settings_signed_out_title()} lead={m.settings_signed_out()} />
        </div>
      ) : (
        <SettingsContent
          login={viewer.login}
          eligible={viewer.eligible}
          country={country}
          birthDate={viewer.birthDate}
          birthDateChangesLeft={viewer.birthDateChangesLeft}
          city={viewer.city}
          gender={viewer.gender}
          dreamTeam={viewer.dreamTeam}
          favoriteTeam={viewer.favoriteTeam}
          cardFace={viewer.cardFace}
        />
      )}
    </main>
  )
}

type SettingsContentProps = {
  login: string
  eligible: boolean
  country?: CountryCode
  birthDate: string | null
  birthDateChangesLeft: number
  city: string | null
  gender: Gender | null
  dreamTeam: string[]
  favoriteTeam: Team | null
  cardFace: ProfileCardFace | null
}

/** Form burada kurulur ki kart, kaydetmeden önce seçilen ülkeyi anlık gösterebilsin. */
function SettingsContent({
  login,
  eligible,
  country,
  birthDate,
  birthDateChangesLeft,
  city,
  gender,
  dreamTeam,
  favoriteTeam,
  cardFace
}: SettingsContentProps) {
  const { data: player, isPending } = useQuery(playerQueryOptions(login))
  const form = useProfileForm({
    country,
    birthDate,
    city,
    gender,
    dreamTeam,
    favoriteTeam,
    cardFace
  })
  const draft = useWatch({ control: form.control, name: "country" })
  const changed = draft !== (country ?? null)
  // Seçilen ülke yalnızca onaylı hesapta karta yansır; diğerlerinde kart olduğu gibi kalır.
  const previewPlayer =
    player && eligible ? { ...player, claimedCountry: draft ?? undefined } : player
  // Kart her değişimde yarım tur daha döner; görünür olmayan yüz bir önceki kartı tutar, böylece
  // gerçek → doğum günü → Kadınlar Günü gibi her geçişte dönüş baştan sona oynar.
  // İlk açılışta kayıtlı kalıcı kart görünür; koşulu artık geçerli değilse gerçek kart.
  const savedFace: CardFace =
    eligible && cardFace === "team" && favoriteTeam
      ? favoriteTeam
      : eligible && cardFace === "github-star" && isGithubStar(login)
        ? "github-star"
        : "real"
  const [flip, setFlip] = useState<{ turns: number; faces: [CardFace, CardFace] }>({
    turns: 0,
    faces: [savedFace, savedFace]
  })
  const visibleIndex = flip.turns % 2
  const shown = flip.faces[visibleIndex] ?? "real"

  const genderDraft = useWatch({ control: form.control, name: "gender" })
  const teamDraft = useWatch({ control: form.control, name: "favoriteTeam" })
  // Yalnızca kişiye o gün çıkacak kartlar önizlenir: Kadınlar Günü kadın seçiliyken, Cumhuriyet Bayramı ülkesi
  // Türkiye iken. Takım kartı seçilen takımınki; diğer takımlar özel kartlar sayfasında görülür.
  const occasionOptions: CardOccasion[] = [
    "birthday",
    // GitHub Star kartını herkes önizleyip indirebilir; kalıcı seçim yalnızca GitHub Stars'a açık olacak.
    "github-star",
    "new-year",
    "programmers-day",
    "halloween",
    ...(previewPlayer && playerCountry(previewPlayer) === "TR" ? (["republic-day"] as const) : []),
    ...(eligible && genderDraft === "female" ? (["womens-day"] as const) : []),
    ...(eligible && teamDraft ? [teamDraft] : [])
  ]

  const changePreview = (next: CardOccasion | null) => {
    const target: CardFace = next ?? "real"
    if (target === shown) return
    setFlip(({ turns, faces }) => {
      const nextFaces: [CardFace, CardFace] = [faces[0], faces[1]]
      nextFaces[(turns + 1) % 2] = target
      return { turns: turns + 1, faces: nextFaces }
    })
  }

  // Kart, kart türü seçicisi ve önizleme notu: genişte solda durur, dar ekranda pencerede açılır.
  const cardPreview = previewPlayer ? (
    <>
      <div
        data-rarity={shown === "birthday" ? "icon" : previewPlayer.rarity}
        className="relative flex w-full justify-center perspective-distant"
      >
        <div aria-hidden className="scout-card-glow pointer-events-none absolute -inset-8" />
        {/* İki yüzlü kart, yalnızca önizleme: gerçek, doğum günü ya da Kadınlar Günü kartı. */}
        <div
          className="relative transition-transform duration-700 ease-out transform-3d motion-reduce:transition-none"
          style={{ transform: `rotateY(${flip.turns * 180}deg)` }}
        >
          <div aria-hidden={visibleIndex !== 0} className="backface-hidden">
            {/* Her dönüşte yeniden kurulur: süsler aşağıdan süzülüp gelir. */}
            <div key={`${flip.faces[0]}-${flip.turns}`} className="card-lift">
              <PreviewCard player={previewPlayer} face={flip.faces[0]} />
            </div>
          </div>
          <div
            aria-hidden={visibleIndex !== 1}
            className="absolute inset-0 rotate-y-180 backface-hidden"
          >
            <div key={`${flip.faces[1]}-${flip.turns}`} className="card-lift">
              <PreviewCard player={previewPlayer} face={flip.faces[1]} />
            </div>
          </div>
        </div>
      </div>
      <CardOccasionPicker
        value={shown === "real" ? null : shown}
        options={occasionOptions}
        onChange={changePreview}
      />
      <p
        aria-live="polite"
        className={cn(
          "text-center text-xs text-muted-foreground transition-opacity",
          changed ? "opacity-100" : "opacity-0"
        )}
      >
        {changed ? m.settings_card_preview() : null}
      </p>
    </>
  ) : null

  return (
    // Sol sütun her zaman yerinde: kart yüklenirken iskelet, kart yoksa yer tutucu durur; form sağda kalır.
    <div className="grid items-start gap-8 md:grid-cols-[20rem_1fr]">
      {/* Onaylı hesapta dar ekranda kart formun önüne geçmez; buton çubuğundaki "Kartımı gör" ile açılır. */}
      <aside
        className={cn(
          "flex flex-col items-center gap-3 md:sticky md:top-6",
          eligible && "max-md:hidden"
        )}
      >
        {cardPreview ??
          (isPending ? (
            <Skeleton className="h-120 w-80 rounded-[28px]" />
          ) : (
            <div className="flex h-120 w-80 max-w-full flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed p-6 text-center">
              <IdCard aria-hidden className="size-6 text-muted-foreground" />
              <p className="text-sm text-pretty text-muted-foreground">{m.settings_no_card()}</p>
            </div>
          ))}
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        {eligible ? (
          <ProfileForm
            form={form}
            login={login}
            birthDate={birthDate}
            birthDateChangesLeft={birthDateChangesLeft}
            cardPreview={shown === "real" ? null : shown}
            onCardPreviewChange={changePreview}
            footerStart={
              cardPreview ? (
                <Dialog>
                  <DialogTrigger
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "md:hidden")}
                  >
                    <IdCard aria-hidden />
                    {m.settings_show_card()}
                  </DialogTrigger>
                  <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] justify-items-center overflow-x-hidden overflow-y-auto px-3 pt-10">
                    <DialogTitle className="sr-only">{m.settings_card_dialog_title()}</DialogTitle>
                    {/* Kart biraz küçük: dar telefonda kenarlara yapışmasın, seçiciyle birlikte ekrana sığsın. */}
                    <div className="flex [zoom:0.9] flex-col items-center gap-3">{cardPreview}</div>
                  </DialogContent>
                </Dialog>
              ) : null
            }
          />
        ) : (
          <p className="surface p-4 text-sm text-balance text-muted-foreground">
            {m.owner_not_eligible({
              months: ACCOUNT_ELIGIBILITY.minAgeMonths
            })}
          </p>
        )}
        {player ? <ReadmeBadgeSection player={player} /> : null}
      </div>
    </div>
  )
}

type CardFace = CardOccasion | "real"

/** Önizlemedeki tek bir yüz. Doğum günü kartı 100 puanlıdır; diğer özel kartlarda puanlar gerçek. */
function PreviewCard({ player, face }: { player: ListPlayer; face: CardFace }) {
  if (face === "real") return <PlayerCard player={player} />
  if (face === "birthday") {
    return (
      <PlayerCard
        player={{ ...player, ovr: BIRTHDAY_OVR, ovrExact: BIRTHDAY_OVR, rarity: "icon" }}
        occasion="birthday"
      />
    )
  }
  return <PlayerCard player={player} occasion={face} />
}

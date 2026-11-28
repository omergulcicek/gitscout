import { useState } from "react"
import type { ReactNode } from "react"

import { ChevronDown, Globe, Lock } from "lucide-react"
import { useViraMask } from "@virastack/mask"
import { Controller, useFormState, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { GENDERS } from "@/constants/account.constants"
import { TEAMS } from "@/constants/team.constants"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BirthDateField } from "@/features/scout/components/BirthDateField"
import { CardFaceField } from "@/features/scout/components/CardFaceField"
import { DreamTeamField } from "@/features/scout/components/DreamTeamField"
import { FavoriteTeamField } from "@/features/scout/components/FavoriteTeamField"
import { FieldHeading } from "@/features/scout/components/FieldHeading"
import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { FIELD_TRIGGER_CLASS } from "@/features/scout/constants/form.constants"
import { COUNTRIES } from "@/features/scout/constants/player-country.constants"
import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { DREAM_TEAM_SIZE } from "@/features/scout/constants/profile.constants"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { countryName } from "@/features/scout/helpers/player-country"
import { PROFILE_MASKS } from "@/features/scout/hooks/use-profile-form"
import { useUpdateBirthDate } from "@/features/scout/hooks/use-update-birth-date"
import { useUpdateProfileCountry } from "@/features/scout/hooks/use-update-profile-country"
import { useUpdateProfileDetails } from "@/features/scout/hooks/use-update-profile-details"
import type {
  ProfileDetailsInput,
  ProfileFormInput,
  ProfileFormValues
} from "@/features/scout/schemas/profile.schema"
import type { CardOccasion } from "@/features/scout/types/card-preview.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/** Radyo gruplarında "seçim yok" değeri: ülkede otomatik, cinsiyette belirtmemek. */
const NONE = "none"

const GENDER_LABELS = {
  female: m.gender_female,
  male: m.gender_male
} as const satisfies Record<(typeof GENDERS)[number], () => string>

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(getLocale(), { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`)
  )

/** Tek istekte kaydedilen isteğe bağlı alanlar. */
const DETAIL_FIELDS = ["city", "gender", "dreamTeam", "favoriteTeam", "cardFace"] as const

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Yan yana iki alan: dar ekranda alt alta, genişte iki eşit sütun. */
const PAIR_CLASS = "grid items-start gap-x-6 gap-y-5 sm:grid-cols-2"

/** Bölüm başlığı: alan etiketlerinden küçük, büyük harfli; formu gruplara ayırır. */
const SECTION_HEADING_CLASS = "text-xs font-medium tracking-wide text-muted-foreground uppercase"

type ProfileFormProps = {
  form: UseFormReturn<ProfileFormInput, unknown, ProfileFormValues>
  /** Kişinin kendi kullanıcı adı; rüya takımına kendini ekleyemez. */
  login: string
  /** Kayıtlı doğum tarihi (YYYY-AA-GG). */
  birthDate: string | null
  /** Kalan doğum tarihi kayıt hakkı: ilk kayıt ve bir düzeltme. */
  birthDateChangesLeft: number
  /** Kart önizlemesinin gösterdiği özel kart; `null` gerçek kart. */
  cardPreview?: CardOccasion | null
  /** Kadın seçimi kalkınca Kadınlar Günü önizlemesinden gerçek karta dönmek için. */
  onCardPreviewChange?: (occasion: CardOccasion | null) => void
  /** Buton çubuğunun soluna gelen içerik; dar ekranda kart önizlemesini açan buton. */
  footerStart?: ReactNode
}

/**
 * Bütün profil bilgileri tek "Kaydet" ile kaydedilir; yalnızca değişen alanlar gönderilir. Doğum tarihi
 * en fazla iki kez kaydedilebildiği için o alan değiştiyse önce onay istenir. Her kural sunucuda yeniden
 * doğrulanır; buradaki `min`, `max` ve maske yalnızca yanlış girişi baştan önler.
 */
export function ProfileForm({
  form,
  login,
  birthDate,
  birthDateChangesLeft,
  cardPreview = null,
  onCardPreviewChange,
  footerStart
}: ProfileFormProps) {
  const updateCountry = useUpdateProfileCountry()
  const updateBirthDate = useUpdateBirthDate()
  const updateDetails = useUpdateProfileDetails()
  const masks = useViraMask(form, PROFILE_MASKS)
  const { isDirty, isSubmitting, errors } = useFormState({ control: form.control })
  const [confirming, setConfirming] = useState(false)

  const birthLocked = birthDateChangesLeft === 0
  const lastChance = birthDate !== null && birthDateChangesLeft === 1
  // Kalıcı kart seçimi formdaki (henüz kaydedilmemiş) favori takımı bilir.
  const draft = useWatch({ control: form.control })

  /** Değişen alanları sırayla kaydeder; başarısız adımda durur. */
  const persist = async (values: ProfileFormValues) => {
    const defaults = form.formState.defaultValues ?? {}
    const changed = <TKey extends keyof ProfileFormValues>(key: TKey) =>
      !sameValue(values[key], defaults[key])

    const steps: {
      run: () => Promise<void>
      fields: (keyof ProfileFormValues)[]
      error: string
    }[] = []
    if (changed("country")) {
      steps.push({
        run: () => updateCountry.mutateAsync(values.country),
        fields: ["country"],
        error: m.owner_save_failed()
      })
    }
    const detailFields = DETAIL_FIELDS.filter((key) => changed(key))
    const details: ProfileDetailsInput = {
      ...(changed("city") ? { city: values.city } : {}),
      ...(changed("gender") ? { gender: values.gender } : {}),
      ...(changed("dreamTeam") ? { dreamTeam: values.dreamTeam } : {}),
      ...(changed("favoriteTeam") ? { favoriteTeam: values.favoriteTeam } : {}),
      ...(changed("cardFace") ? { cardFace: values.cardFace } : {})
    }
    if (detailFields.length > 0) {
      steps.push({
        run: () => updateDetails.mutateAsync(details),
        fields: detailFields,
        error: m.profile_save_failed()
      })
    }
    if (values.birthDate !== "" && changed("birthDate")) {
      steps.push({
        run: () => updateBirthDate.mutateAsync(values.birthDate),
        fields: ["birthDate"],
        error: m.birth_date_save_failed()
      })
    }

    for (const step of steps) {
      try {
        await step.run()
      } catch {
        // Hata formda gösterilir. Ondan önce kaydedilen adımlar artık "değişmemiş" sayılır.
        form.setError("root.server", { message: step.error })
        setConfirming(false)
        return
      }
      for (const field of step.fields) {
        form.resetField(field, { defaultValue: values[field] })
      }
    }
    setConfirming(false)
    toast.success(m.owner_saved())
  }

  // Doğum tarihi değiştiyse kayıt onay penceresinden yapılır.
  const onSubmit = form.handleSubmit(async (values) => {
    if (values.birthDate !== "" && values.birthDate !== (birthDate ?? "")) {
      setConfirming(true)
      return
    }
    await persist(values)
  })
  const onConfirm = form.handleSubmit(persist)
  const draftBirthDate = form.getValues("birthDate")

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby="profile-heading"
      // Dar ekranda alt boşluğu yapışık çubuk verir; form da verirse butonların altı üstünden geniş kalır.
      className="surface flex flex-col gap-6 p-4 max-md:pb-0"
    >
      <h2 id="profile-heading" className="text-sm font-semibold">
        {m.settings_profile_title()}
      </h2>

      {/* Açıklamalar etiketin yanındaki bilgi simgesinde; ekranda yalnızca etiket, gizlilik işareti ve
          sonucu olan kısa uyarı (doğum tarihi hakkı) kalır. */}
      <section aria-labelledby="personal-heading" className="flex flex-col gap-5">
        <h3 id="personal-heading" className={SECTION_HEADING_CLASS}>
          {m.settings_section_personal()}
        </h3>
        <div className={PAIR_CLASS}>
          <div className="flex flex-col gap-2">
            <FieldHeading
              id="country-label"
              label={m.owner_country_label()}
              info={m.owner_country_hint()}
            />
            <Controller
              name="country"
              control={form.control}
              render={({ field }) => (
                <CountryField
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          <Field data-invalid={errors.city ? true : undefined} className="gap-2">
            <FieldHeading
              id="city-label"
              htmlFor="profile-city"
              label={m.city_label()}
              info={m.city_hint()}
              isPrivate
            />
            <Input
              {...masks.city}
              id="profile-city"
              placeholder={m.city_placeholder()}
              disabled={isSubmitting}
              aria-invalid={errors.city ? true : undefined}
              aria-describedby={errors.city ? "profile-city-error" : undefined}
            />
            {errors.city ? <FieldError id="profile-city-error" errors={[errors.city]} /> : null}
          </Field>
        </div>

        <div className={PAIR_CLASS}>
          <Controller
            name="gender"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <FieldHeading
                  id="gender-label"
                  label={m.gender_label()}
                  info={m.gender_hint()}
                  isPrivate
                />
                <RadioGroup
                  aria-labelledby="gender-label"
                  value={field.value ?? NONE}
                  onValueChange={(value) => {
                    const next = GENDERS.find((gender) => gender === value) ?? null
                    field.onChange(next)
                    // Kadınlar Günü kartı yalnızca kadın seçiliyken önizlenir; seçim değişince gerçek karta dönülür.
                    if (next !== "female" && cardPreview === "womens-day") {
                      onCardPreviewChange?.(null)
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex min-h-9 w-auto flex-wrap items-center gap-x-5 gap-y-2"
                >
                  {GENDERS.map((gender) => (
                    <Label key={gender} className="flex items-center gap-2 text-sm font-normal">
                      <RadioGroupItem value={gender} />
                      {GENDER_LABELS[gender]()}
                    </Label>
                  ))}
                  <Label className="flex items-center gap-2 text-sm font-normal">
                    <RadioGroupItem value={NONE} />
                    {m.gender_unset()}
                  </Label>
                </RadioGroup>
              </div>
            )}
          />

          <div className="flex flex-col gap-2">
            <FieldHeading
              id="birth-label"
              label={m.birth_date_label()}
              info={m.birth_date_hint()}
              isPrivate
            />
            {birthLocked && birthDate ? (
              <p className="flex min-h-9 items-center gap-2 text-sm">
                <Lock aria-hidden className="size-4 text-muted-foreground" />
                {formatDate(birthDate)}
                <span className="text-xs text-muted-foreground">{m.birth_date_locked()}</span>
              </p>
            ) : (
              <>
                <Controller
                  name="birthDate"
                  control={form.control}
                  render={({ field }) => (
                    <BirthDateField
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      describedBy="birth-rule"
                    />
                  )}
                />
                <p id="birth-rule" className="text-xs text-muted-foreground">
                  {lastChance ? m.birth_date_rule_last() : m.birth_date_rule_first()}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="card-heading" className="flex flex-col gap-5 pt-2">
        <h3 id="card-heading" className={SECTION_HEADING_CLASS}>
          {m.settings_section_card()}
        </h3>
        <div className={PAIR_CLASS}>
          <div className="flex flex-col gap-2">
            <FieldHeading id="team-label" label={m.team_label()} info={m.team_hint()} />
            <Controller
              name="favoriteTeam"
              control={form.control}
              render={({ field }) => (
                <FavoriteTeamField
                  value={field.value}
                  onChange={(next) => {
                    field.onChange(next)
                    // Takım kartı önizleniyorsa yeni takımın kartına geçilir; takım kalkınca gerçek karta dönülür.
                    if (cardPreview && TEAMS.some((team) => team === cardPreview)) {
                      onCardPreviewChange?.(next)
                    }
                    // Takım kaldırılınca kalıcı takım kartı seçimi de gerçek karta döner.
                    if (!next && form.getValues("cardFace") === "team") {
                      form.setValue("cardFace", null, { shouldDirty: true })
                    }
                  }}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldHeading
              id="card-face-label"
              label={m.card_face_label()}
              info={m.card_face_hint()}
            />
            <Controller
              name="cardFace"
              control={form.control}
              render={({ field }) => (
                <CardFaceField
                  value={field.value}
                  team={draft.favoriteTeam ?? null}
                  githubStar={isGithubStar(login)}
                  onChange={(next) => {
                    field.onChange(next)
                    // Seçilen kalıcı yüz soldaki önizlemede hemen görünür.
                    const preview = next === "team" ? (draft.favoriteTeam ?? null) : next
                    onCardPreviewChange?.(preview)
                  }}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>
      </section>

      <Controller
        name="dreamTeam"
        control={form.control}
        render={({ field }) => (
          <section aria-labelledby="dream-team-label" className="flex flex-col gap-2 pt-2">
            <FieldHeading
              id="dream-team-label"
              label={m.dream_team_label()}
              aside={
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {m.dream_team_count({ count: field.value.length, size: DREAM_TEAM_SIZE })}
                </span>
              }
            />
            <p className="-mt-1 text-xs text-balance text-muted-foreground">
              {m.dream_team_hint({ size: DREAM_TEAM_SIZE })}
            </p>
            <DreamTeamField
              value={field.value}
              onChange={field.onChange}
              ownLogin={login}
              disabled={isSubmitting}
            />
          </section>
        )}
      />

      {errors.root?.server ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.server.message}
        </p>
      ) : null}

      {/* Dar ekranda çubuk ekranın altına yapışır: form uzunken Kaydet ve kart önizlemesi hep elde. */}
      <div className="-mx-4 flex items-center justify-end gap-2 border-t px-4 pt-4 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:rounded-b-xl max-md:bg-card max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {footerStart ? <div className="me-auto">{footerStart}</div> : null}
        {isDirty && !isSubmitting ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => form.reset()}>
            {m.settings_cancel()}
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? m.settings_saving() : m.settings_save()}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.birth_date_confirm_title()}</AlertDialogTitle>
            <AlertDialogDescription>
              {draftBirthDate
                ? m.birth_date_confirm_body({ date: formatDate(draftBirthDate) })
                : null}{" "}
              {lastChance ? m.birth_date_confirm_last() : m.birth_date_confirm_first()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.settings_cancel()}</AlertDialogCancel>
            <AlertDialogAction disabled={isSubmitting} onClick={() => void onConfirm()}>
              {isSubmitting ? m.settings_saving() : m.settings_save()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

type CountryFieldProps = {
  value: CountryCode | null
  onChange: (country: CountryCode | null) => void
  disabled: boolean
}

function CountryField({ value, onChange, disabled }: CountryFieldProps) {
  const collator = new Intl.Collator(getLocale())
  const countries = [...COUNTRIES].sort((a, b) => collator.compare(countryName(a), countryName(b)))
  const Flag = value ? COUNTRY_FLAGS[value] : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-labelledby="country-label country-value"
        disabled={disabled}
        className={FIELD_TRIGGER_CLASS}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Flag ? <Flag aria-hidden className={FLAG_CLASS} /> : <Globe aria-hidden />}
          <span id="country-value" className="truncate">
            {value ? countryName(value) : m.owner_country_auto()}
          </span>
        </span>
        <ChevronDown aria-hidden className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-auto min-w-56 overscroll-contain">
        <DropdownMenuRadioGroup
          value={value ?? NONE}
          onValueChange={(next) => onChange(COUNTRIES.find((country) => country === next) ?? null)}
        >
          <DropdownMenuRadioItem value={NONE} closeOnClick>
            {m.owner_country_auto()}
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {countries.map((country) => {
            const ItemFlag = COUNTRY_FLAGS[country]
            return (
              <DropdownMenuRadioItem key={country} value={country} closeOnClick>
                <ItemFlag aria-hidden className={FLAG_CLASS} />
                <span className="whitespace-nowrap">{countryName(country)}</span>
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

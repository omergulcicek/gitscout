import { useRef, useState } from "react"
import type { FormEvent } from "react"

import { useNavigate } from "@tanstack/react-router"
import { CornerDownLeft, LoaderCircle } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "cn"
import { Controller, useForm } from "react-hook-form"

import { CARD_FAILURE_REASONS } from "@/schemas/analytics.schema"

import { trackEvent } from "@/lib/analytics"
import { getLangParam } from "@/helpers/localized-url"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScoutingProgress } from "@/features/scout/components/ScoutingProgress"
import { errorText } from "@/features/scout/helpers/error-text"
import { useAddPlayer } from "@/features/scout/hooks/use-add-player"
import { addPlayerSchema } from "@/features/scout/schemas/player.schema"
import type { AddPlayerInput } from "@/features/scout/schemas/player.schema"
import type { ScoutingProfile, ScoutingStage } from "@/features/scout/types/add-player.types"
import * as m from "@/paraglide/messages.js"

/** Sunucudan gelen aşama bitince sıradaki adıma geçilir. */
const NEXT_STEP = { profile: 1, repos: 2, activity: 3 } as const satisfies Record<
  ScoutingStage["stage"],
  number
>

type Progress = { step: number; profile: ScoutingProfile | null }

type AddPlayerFormProps = {
  /** Bulunamayan bir profil sayfasında kullanıcı adı hazır gelir. */
  defaultUsername?: string
  /** Dar kutularda: kısa buton, beklerken adım listesi yerine tek bir yazı. */
  compact?: boolean
  /** `command`: ana sayfa hero'su; `github.com/` önekli tek parça çubuk, buton alanın içinde. */
  variant?: "default" | "command"
}

export function AddPlayerForm({
  defaultUsername = "",
  compact = false,
  variant = "default"
}: AddPlayerFormProps) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<Progress>({ step: 0, profile: null })
  // Stages only arrive while a new card is being scouted; an existing card comes back without any.
  const isNewCard = useRef(false)
  const addPlayer = useAddPlayer({
    onStage: (event) => {
      isNewCard.current = true
      setProgress((current) => ({
        step: Math.max(current.step, NEXT_STEP[event.stage]),
        profile: event.stage === "profile" ? event.profile : current.profile
      }))
    }
  })
  const form = useForm<AddPlayerInput>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: { username: defaultUsername }
  })

  const submit = async (values: AddPlayerInput) => {
    setProgress({ step: 0, profile: null })
    isNewCard.current = false
    try {
      const player = await addPlayer.mutateAsync(values.username)
      trackEvent({ name: "card_requested", login: player.login })
      form.reset()
      await navigate({
        to: "/{-$lang}/u/$username",
        params: { lang: getLangParam(), username: player.login },
        // A brand-new card opens with its reveal; looking up an existing card doesn't.
        state: (previous) => ({ ...previous, cardReveal: isNewCard.current })
      })
    } catch (error) {
      // Yalnızca hata kodu gider (ör. github:not-found); yazılan metin gönderilmez.
      trackEvent({ name: "card_request_failed", reason: failureReason(error) })
      form.setError("root.server", { message: errorText(error) })
    }
  }
  // Wrapped per event so the ref is only read when the form is submitted, never during render.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => void form.handleSubmit(submit)(event)

  const isSubmitting = form.formState.isSubmitting
  const progressList =
    isSubmitting && !compact ? (
      <ScoutingProgress step={progress.step} profile={progress.profile} />
    ) : null

  if (variant === "command") {
    return (
      <form onSubmit={onSubmit} noValidate className="flex w-full max-w-xl flex-col gap-2">
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor={field.name} className="sr-only">
                {m.add_label()}
              </FieldLabel>
              {/* Çubuğun tamamı alan gibi davranır: odak halkası ve hata rengi dış kutuda. */}
              <div
                className={cn(
                  "flex h-14 items-center rounded-xl bg-card py-1.5 ps-4 pe-1.5 ring-1 ring-input transition-shadow md:h-12 md:py-1 md:pe-1",
                  "focus-within:ring-[3px] focus-within:ring-ring focus-within:ring-offset-0",
                  fieldState.invalid && "ring-destructive focus-within:ring-destructive/40"
                )}
              >
                {/* Dar ekranda yer açmak için önek gizlenir; placeholder ne yazılacağını söyler. */}
                <span
                  aria-hidden
                  className="hidden font-mono text-base text-muted-foreground sm:inline md:text-[15px]"
                >
                  github.com/
                </span>
                <Input
                  {...field}
                  id={field.name}
                  placeholder={m.add_placeholder_handle()}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-full rounded-none border-0 bg-transparent px-0 font-mono text-base shadow-none focus-visible:ring-0 md:text-[15px] dark:bg-transparent"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="ms-2 h-11 shrink-0 rounded-lg px-4 md:h-10"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle
                        aria-hidden
                        className="animate-spin motion-reduce:animate-none"
                      />
                      {m.add_preparing()}
                    </>
                  ) : (
                    <>
                      {m.add_submit()}
                      <kbd
                        aria-hidden
                        className="hidden size-5 place-items-center rounded-sm bg-primary-foreground/10 sm:grid"
                      >
                        <CornerDownLeft className="size-3" />
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
              {fieldState.invalid ? (
                <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        {progressList}
        <p role="alert" className="text-sm text-destructive empty:hidden">
          {form.formState.errors.root?.server?.message}
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full max-w-2xl flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="flex-1 gap-1.5">
              <FieldLabel htmlFor={field.name} className="sr-only">
                {m.add_label()}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder={m.add_placeholder()}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="h-11"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
              />
              {fieldState.invalid ? (
                <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          // Bekleme yazısı gelince buton genişliği oynamasın.
          className={cn("h-11 px-5", compact ? "sm:w-44" : "sm:w-48")}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
              {m.add_preparing()}
            </>
          ) : (
            m.add_submit()
          )}
        </Button>
      </div>
      {progressList}
      <p role="alert" className="text-sm text-destructive empty:hidden">
        {form.formState.errors.root?.server?.message}
      </p>
    </form>
  )
}

/** The error's code if it's one we track, else `other`; free text never reaches analytics. */
function failureReason(error: unknown): (typeof CARD_FAILURE_REASONS)[number] {
  const code = error instanceof Error ? error.message : ""
  return CARD_FAILURE_REASONS.find((reason) => reason === code) ?? "other"
}

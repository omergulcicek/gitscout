import { useState } from "react"

import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { Snowflake } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { getLangParam } from "@/helpers/localized-url"

import { useViewer } from "@/hooks/use-viewer"

import { GithubMark } from "@/components/shared/GithubMark"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  playersByLoginQueryOptions,
  specialCardsSampleQueryOptions
} from "@/features/scout/api/players.queries"
import { SeasonSnow } from "@/features/scout/components/SeasonSnow"
import { SeasonTimeline } from "@/features/scout/components/SeasonTimeline"
import { SnowyCard } from "@/features/scout/components/SnowyCard"
import { usernameSchema } from "@/features/scout/schemas/player.schema"
import * as m from "@/paraglide/messages.js"

const formSchema = z.object({ username: usernameSchema })
type FormValues = z.infer<typeof formSchema>

/**
 * The menu's season entry. A signed-in player with a card sees their own New Year card and goes straight
 * to their report; anyone else sees a sample card. Any player's season can still be looked up by name,
 * since every report is public.
 */
export function SeasonLanding() {
  const lang = getLangParam()
  const { data: viewer } = useViewer()
  const { data: sample } = useSuspenseQuery(specialCardsSampleQueryOptions())
  const { data: own } = useQuery({
    ...playersByLoginQueryOptions(viewer ? [viewer.login] : []),
    enabled: Boolean(viewer)
  })
  const ownCard = own?.[0] ?? null
  const card = ownCard ?? sample
  // Fixed at first render so the marked step can't change between the server and the browser.
  const [now] = useState(() => new Date())

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 overflow-x-clip px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <SeasonSnow count={160} />

      <section className="grid items-center gap-12 md:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-5">
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            <Snowflake aria-hidden className="size-4" />
            {m.season_landing_eyebrow()}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">
            {m.season_landing_title()}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{m.season_landing_lead()}</p>
          <div className="flex flex-wrap items-center gap-3">
            {ownCard ? (
              <Link
                to="/{-$lang}/u/$username/season"
                params={{ lang, username: ownCard.login }}
                search={{}}
                className={buttonVariants({ size: "lg" })}
              >
                <Snowflake aria-hidden />
                {m.season_landing_cta_own()}
              </Link>
            ) : viewer ? (
              <Link to="/{-$lang}" params={{ lang }} className={buttonVariants({ size: "lg" })}>
                {m.season_landing_cta_create()}
              </Link>
            ) : (
              <>
                <Link
                  to="/{-$lang}/login"
                  params={{ lang }}
                  className={buttonVariants({ size: "lg" })}
                >
                  <GithubMark />
                  {m.season_landing_cta_login()}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {m.season_landing_login_hint()}
                </span>
              </>
            )}
          </div>
        </div>

        {card ? (
          <figure className="flex flex-col items-center gap-5">
            <SnowyCard player={card} />
            <figcaption className="text-sm text-muted-foreground">
              {ownCard
                ? m.season_landing_card_own()
                : m.season_landing_card_sample({ login: card.login })}
            </figcaption>
          </figure>
        ) : null}
      </section>

      <SeasonTimeline now={now} />

      <SeasonLookup />
    </main>
  )
}

/** Opens any player's season by GitHub username. */
function SeasonLookup() {
  const lang = getLangParam()
  const navigate = useNavigate()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" }
  })
  const error = form.formState.errors.username

  const submit = form.handleSubmit(({ username }) =>
    navigate({ to: "/{-$lang}/u/$username/season", params: { lang, username }, search: {} })
  )

  return (
    <section
      aria-labelledby="season-lookup-heading"
      className="surface season-ice flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between"
    >
      <div className="flex flex-col gap-1">
        <h2 id="season-lookup-heading" className="font-semibold">
          {m.season_lookup_title()}
        </h2>
        <p className="text-sm text-muted-foreground">{m.season_lookup_text()}</p>
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-end md:max-w-md"
      >
        <Field className="flex-1" data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="season-username" className="sr-only">
            {m.season_landing_label()}
          </FieldLabel>
          <Input
            id="season-username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="octocat"
            aria-invalid={error ? true : undefined}
            {...form.register("username")}
          />
          <FieldError errors={[error]} />
        </Field>
        <Button type="submit" variant="outline">
          {m.season_landing_submit()}
        </Button>
      </form>
    </section>
  )
}

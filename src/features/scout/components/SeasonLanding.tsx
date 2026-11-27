import { useState } from "react"

import { Link, useNavigate } from "@tanstack/react-router"
import { Snowflake } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { getLangParam } from "@/helpers/localized-url"

import { useViewer } from "@/hooks/use-viewer"

import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SeasonSnow } from "@/features/scout/components/SeasonSnow"
import { SeasonTimeline } from "@/features/scout/components/SeasonTimeline"
import { usernameSchema } from "@/features/scout/schemas/player.schema"
import * as m from "@/paraglide/messages.js"

const formSchema = z.object({ username: usernameSchema })
type FormValues = z.infer<typeof formSchema>

/**
 * The menu's season entry: what the season report is, when each part happens, and a way in — the
 * signed-in person's own season, or any username.
 */
export function SeasonLanding() {
  const lang = getLangParam()
  const navigate = useNavigate()
  const { data: viewer } = useViewer()
  // Fixed at first render so the marked step can't change between the server and the browser.
  const [now] = useState(() => new Date())
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" }
  })

  const submit = form.handleSubmit(({ username }) =>
    navigate({ to: "/{-$lang}/u/$username/season", params: { lang, username }, search: {} })
  )

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <SeasonSnow count={160} />
      <header className="flex max-w-2xl flex-col gap-4">
        <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
          <Snowflake aria-hidden className="size-4" />
          {m.season_landing_eyebrow()}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
          {m.season_landing_title()}
        </h1>
        <p className="text-muted-foreground">{m.season_landing_lead()}</p>
        <form
          onSubmit={submit}
          noValidate
          className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field
            className="flex-1"
            data-invalid={form.formState.errors.username ? true : undefined}
          >
            <FieldLabel htmlFor="season-username">{m.season_landing_label()}</FieldLabel>
            <Input
              id="season-username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="octocat"
              aria-invalid={form.formState.errors.username ? true : undefined}
              {...form.register("username")}
            />
            <FieldError errors={[form.formState.errors.username]} />
          </Field>
          <Button type="submit">{m.season_landing_submit()}</Button>
        </form>
        {viewer ? (
          <Link
            to="/{-$lang}/u/$username/season"
            params={{ lang, username: viewer.login }}
            search={{}}
            className={buttonVariants({ variant: "outline", className: "w-fit" })}
          >
            {m.season_landing_own()}
          </Link>
        ) : null}
      </header>

      <SeasonTimeline now={now} />
    </main>
  )
}

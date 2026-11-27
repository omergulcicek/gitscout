-- Hardens the view counters that rank popular duels and profiles.
-- 1. Profile, duel and event de-duplication and the per-visitor daily cap now key on the IP alone (the app
--    sends an IPv4 address or an IPv6 /64 block). The User-Agent is free for a script to rotate, which made
--    every request look like a new visitor. Page-path "visitors" keep IP + User-Agent, since they are only
--    a traffic estimate and people behind one NAT shouldn't collapse into one.
-- 2. Profile and duel paths, and events, are recorded only for logins that exist in `players`; random
--    names can no longer add rows or inflate counters.
-- Existing rows are left untouched.

create or replace function gitscout.record_page_view(p_path text, p_ip text, p_ua text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'utc')::date;
  login_re constant text := '^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$';
  v bytea;
  v_ip bytea;
  is_new boolean;
  profile text[];
  duel text[];
  a text;
  b text;
begin
  if p_path is null or p_path !~ '^/' or char_length(p_path) > 2048 then
    raise exception 'invalid path' using errcode = '22023';
  end if;

  -- Profile and duel pages count only for registered players; anything else is not recorded at all.
  profile := regexp_match(p_path, '^(?:/(?:tr|en))?/u/([^/]+)/?$');
  duel := regexp_match(p_path, '^(?:/(?:tr|en))?/vs/([^/]+)/([^/]+)/?$');
  if profile is not null then
    a := lower(profile[1]);
    if a !~ login_re or not exists (select 1 from gitscout.players where login = a) then
      return;
    end if;
  elsif duel is not null then
    a := least(lower(duel[1]), lower(duel[2]));
    b := greatest(lower(duel[1]), lower(duel[2]));
    if a = b or a !~ login_re or b !~ login_re
      or (select count(*) from gitscout.players where login in (a, b)) < 2 then
      return;
    end if;
  end if;

  v := gitscout.visitor_hash(p_ip, p_ua);
  v_ip := gitscout.visitor_hash(p_ip, 'ip');

  -- pageviews counts every open (traffic), visitors the day's unique people.
  is_new := gitscout.first_seen(v, 'path', p_path);
  insert into gitscout.page_views as t (day, path, pageviews, visitors, source)
  values (today, p_path, 1, case when is_new then 1 else 0 end, 'site')
  on conflict (day, path, source) do update
    set pageviews = t.pageviews + 1,
        visitors = t.visitors + case when is_new then 1 else 0 end;

  if not gitscout.under_daily_cap(v_ip) then
    return;
  end if;

  -- One count per IP per day; the language prefix and casing merge, and A–B equals B–A.
  if profile is not null then
    if gitscout.first_seen(v_ip, 'profile', a) then
      insert into gitscout.profile_views as t (login, day, views, source)
      values (a, today, 1, 'site')
      on conflict (login, day, source) do update set views = t.views + 1;
    end if;
  elsif duel is not null then
    if gitscout.first_seen(v_ip, 'duel', a || '|' || b) then
      insert into gitscout.duel_views as t (left_login, right_login, day, views, source)
      values (a, b, today, 1, 'site')
      on conflict (left_login, right_login, day, source) do update set views = t.views + 1;
    end if;
  end if;
end;
$$;

create or replace function gitscout.record_event(p_name text, p_data jsonb, p_ip text, p_ua text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_data jsonb := coalesce(p_data, '{}');
  v_login text;
begin
  if p_name is null or p_name not in (
    'card_requested', 'card_request_failed', 'card_downloaded', 'card_shared',
    'duel_shared', 'github_star_clicked', 'readme_badge_copied'
  ) then
    raise exception 'unknown event' using errcode = '22023';
  end if;

  -- Every login an event names must be a registered player.
  foreach v_login in array array[v_data ->> 'login', v_data ->> 'left', v_data ->> 'right'] loop
    if v_login is not null
      and not exists (select 1 from gitscout.players where login = lower(v_login)) then
      return;
    end if;
  end loop;

  if not gitscout.first_seen(gitscout.visitor_hash(p_ip, 'ip'), 'event', p_name || v_data::text) then
    return;
  end if;

  insert into gitscout.events as t (day, name, data, count, visitors, source)
  values ((now() at time zone 'utc')::date, p_name, v_data, 1, 1, 'site')
  on conflict (day, name, data, source) do update
    set count = t.count + 1, visitors = t.visitors + 1;
end;
$$;

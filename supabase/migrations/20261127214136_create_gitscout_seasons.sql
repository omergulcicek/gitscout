-- Frozen seasons: one row per GitHub account and calendar year, written once after the year closes.
-- The stored calendar on a card is a rolling year that the hourly refresh overwrites, so a closed season
-- is fetched from GitHub for its exact dates and kept here. Insert only: no role may update or delete.

create table gitscout.seasons (
  -- GitHub's numeric account id; a login can change hands, the id can't.
  github_id bigint not null check (github_id > 0),
  year smallint not null check (year between 2008 and 2100),
  -- Login at freezing time, lower case; only a fallback for cards stored before the id was kept.
  login text not null check (login = lower(login)),
  -- Shape of `data`; readers handle every version ever written.
  format smallint not null check (format > 0),
  -- Raw figures only (daily counts, totals, card snapshot); the season's numbers are computed on read.
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 100000),
  frozen_at timestamptz not null default now(),
  primary key (github_id, year)
);

create index seasons_year_login_idx on gitscout.seasons (year, login);

-- Data API roles get nothing.
revoke all on gitscout.seasons from public, anon, authenticated, service_role;

-- The site freezes a season on first view after the year closes; the hourly job freezes the rest.
grant select, insert on gitscout.seasons to gitscout_app;
grant select, insert on gitscout.seasons to gitscout_refresher;

alter table gitscout.seasons enable row level security;
alter table gitscout.seasons force row level security;

create policy seasons_read on gitscout.seasons for select to gitscout_app using (true);
create policy seasons_insert on gitscout.seasons for insert to gitscout_app with check (true);
create policy seasons_refresh_read on gitscout.seasons for select to gitscout_refresher using (true);
create policy seasons_refresh_insert on gitscout.seasons for insert to gitscout_refresher with check (true);

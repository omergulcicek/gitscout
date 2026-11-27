-- Links accounts to cards by GitHub's numeric account id instead of the login. A login can change hands;
-- joined by login, the new owner's card showed the old owner's verified badge, country and birthday.
-- The id comes from the stored facts (`facts.githubId`), so every insert and refresh keeps it current
-- without new write grants. Existing cards are backfilled once from GitHub (scripts/backfill-github-ids.mjs).
alter table gitscout.players
  add column github_id bigint generated always as ((facts ->> 'githubId')::bigint) stored;

create index players_github_id_idx on gitscout.players (github_id);

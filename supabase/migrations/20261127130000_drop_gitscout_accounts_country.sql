-- The owner's country now lives in gitscout.players.country, the single source the cards read.
-- country_updated_at stays: it rate-limits country changes from the settings page.
alter table gitscout.accounts drop column country;

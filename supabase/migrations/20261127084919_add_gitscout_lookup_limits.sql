-- Yeni kart sorgularına IP başına saatlik ve günlük sınır. Yalnızca GitHub'a giden sorgular sayılır;
-- kayıtlı bir kartı açmak sayılmaz. Kişi, görüntülenme sayacındaki gibi günlük tuzla hash(IP) olarak
-- tutulur; ham IP hiçbir yere yazılmaz. Tuz her gün değiştiği için günlük sayaç UTC gece yarısı sıfırlanır.
-- Satırlar yalnızca bu tablodan, fonksiyonun kendisi tarafından silinir.

create table gitscout.lookup_attempts (
  visitor bytea not null,
  hour timestamp not null,
  count integer not null check (count > 0),
  primary key (visitor, hour)
);

revoke all on gitscout.lookup_attempts from public, anon, authenticated, service_role;
alter table gitscout.lookup_attempts enable row level security;
alter table gitscout.lookup_attempts force row level security;

-- Bu IP kovası için bir sorgu hakkı harcar. Saatlik ya da günlük sınır doluysa hiçbir şey yazmaz ve
-- false döner. Aynı kova için eşzamanlı çağrılar kilitle sıraya girer; sınır aşılamaz.
create function gitscout.take_lookup(p_bucket text, p_hour_limit integer, p_day_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_utc timestamp := now() at time zone 'utc';
  this_hour timestamp := date_trunc('hour', now_utc);
  today timestamp := date_trunc('day', now_utc);
  v bytea;
  hour_count integer;
  day_count integer;
begin
  if p_bucket is null or char_length(p_bucket) > 64 or p_hour_limit < 1 or p_day_limit < 1 then
    raise exception 'invalid lookup limit' using errcode = '22023';
  end if;
  v := gitscout.visitor_hash(p_bucket, 'lookup');
  perform pg_advisory_xact_lock(hashtextextended(encode(v, 'hex'), 0));

  delete from gitscout.lookup_attempts where hour < today;

  select coalesce(sum(count), 0), coalesce(sum(count) filter (where hour = this_hour), 0)
  into day_count, hour_count
  from gitscout.lookup_attempts
  where visitor = v;

  if hour_count >= p_hour_limit or day_count >= p_day_limit then
    return false;
  end if;

  insert into gitscout.lookup_attempts as t (visitor, hour, count)
  values (v, this_hour, 1)
  on conflict (visitor, hour) do update set count = t.count + 1;
  return true;
end;
$$;

revoke all on function gitscout.take_lookup(text, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function gitscout.take_lookup(text, integer, integer) to gitscout_app;

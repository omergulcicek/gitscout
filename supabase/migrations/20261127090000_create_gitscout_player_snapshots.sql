-- Oyuncuların zaman içindeki puanı ve sırası. Şimdilik yalnızca veri toplanır, arayüz sonra karar verilecek.
-- Yalnızca ekleme yapan, geri alınabilir bir değişiklik. Satırları saatlik yenileme işi (gitscout_refresher)
-- yazar; site rolü (gitscout_app) yalnızca okur. Silme ve güncelleme yetkisi kimsede yok.

create table gitscout.player_snapshots (
  login text not null references gitscout.players (login),
  -- Bir turdaki bütün satırlar aynı anı taşır; tur bu değerle gruplanır.
  taken_at timestamptz not null,
  ovr smallint not null check (ovr between 0 and 100),
  -- Liderlik tablosundaki sıra: yuvarlanmamış genel puana, eşitlikte kullanıcı adına göre.
  rank integer not null check (rank > 0),
  -- Puanın hangi formülle hesaplandığı. Farklı sürümlerdeki puanlar birbiriyle karşılaştırılmamalı.
  score_version integer not null check (score_version > 0),
  primary key (login, taken_at)
);

create index player_snapshots_taken_at_idx on gitscout.player_snapshots (taken_at desc);

-- Data API rolleri hiçbir şekilde erişemez.
revoke all on gitscout.player_snapshots from public, anon, authenticated, service_role;

grant select on gitscout.player_snapshots to gitscout_app;
grant select, insert on gitscout.player_snapshots to gitscout_refresher;

alter table gitscout.player_snapshots enable row level security;
alter table gitscout.player_snapshots force row level security;

create policy player_snapshots_read on gitscout.player_snapshots for select to gitscout_app using (true);
create policy player_snapshots_refresh_read on gitscout.player_snapshots for select to gitscout_refresher using (true);
create policy player_snapshots_refresh_insert on gitscout.player_snapshots for insert to gitscout_refresher with check (true);

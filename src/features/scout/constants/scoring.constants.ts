import type { Position, Rarity, StatKey } from "@/features/scout/types/player.types"

/** Bütün eşikler ve ağırlıklar burada; revizyonlar bu dosyadan yapılır. */

/**
 * Veritabanındaki puan özetlerinin sürümü. Bu dosyadaki bir formül ya da eşik değişince bir artırılır;
 * eski sürümdeki özetler ilk okumada ham veriden yeniden hesaplanır.
 */
export const SCORE_VERSION = 8

/**
 * Saatte en fazla bu kadar yeni oyuncu eklenir: GitHub token limitini ve veritabanını korur.
 * Kart başına ~9 GraphQL puanı; 5000 puanlık saatlik kotada ~550 kart eder, gerisi geçersiz
 * aramalar, büyük profiller ve saatlik yenileme için pay.
 */
export const NEW_PLAYERS_PER_HOUR = 300

/**
 * Tek bir IP'nin (IPv6'da /64 bloğunun) GitHub'a gidebilecek yeni kart sorgusu. Kayıtlı kartı açmak sayılmaz.
 * Kart başına ~9 puanla saatte 20 sorgu ~180 puan eder; tek kişi saatlik ortak sınırı tek başına dolduramaz.
 * Vercel Firewall ayrıca IP başına 10 dakikada 8 kart ekleme isteğine izin verir.
 */
export const NEW_LOOKUPS_PER_IP = { hour: 20, day: 50 } as const

/**
 * Bulunamayan kullanıcı adı bu süre boyunca GitHub'a yeniden sorulmaz. Kısa tutulur: az önce açılan ya da
 * adı değişen bir hesap en geç bu süre sonra eklenebilir.
 */
export const NOT_FOUND_TTL_MS = 10 * 60_000

/**
 * Otomatik yenileme: verisi `maxAgeDays` günden eski kartlar en eskiden başlayarak yenilenir. Her çalışma
 * `timeBudgetMs` dolana ya da `maxPerRun` karta ulaşana kadar sürer; böylece kart sayısı arttıkça çalışma
 * başına yenilenen kart da artar, eskimiş kart yoksa hiç iş yapılmaz. Sabit 3 kartla saatlik çalışma haftada
 * en fazla ~500 kart yenileyebiliyordu; fazlası sessizce haftalarca eski kalıyordu.
 * Kota: 30 kart × ~9 puan ≈ 270 puan/saat, yeni kart payının (~2700) yanında rahat sığar.
 * Süre sınırı yeni bir karta başlamadan önce kontrol edilir; son kart bu sürenin biraz üstüne taşabilir.
 */
export const REFRESH = { maxAgeDays: 7, maxPerRun: 30, timeBudgetMs: 50_000 }

/**
 * Puan ve sıra geçmişi: saatlik yenileme işi son kayıttan bu kadar gün geçince bütün oyuncuların puanını ve
 * sırasını kaydeder. `SCORE_VERSION` değişince süre beklenmeden yeni bir kayıt alınır.
 */
export const SNAPSHOT_INTERVAL_DAYS = 14

export const STAT_WEIGHTS: Record<StatKey, number> = {
  act: 0.2,
  imp: 0.2,
  com: 0.15,
  rep: 0.2,
  con: 0.1,
  exp: 0.15
}

/** Kartta statların sırası: ilk üçü sol sütun, son üçü sağ sütun. */
export const STAT_ORDER: StatKey[] = ["act", "imp", "com", "rep", "con", "exp"]

/**
 * Radar dizilimi (saat yönünde): İstikrar üstte, sonra Topluluk, Kıdem, Saygınlık (alt), Aktivite, Etki.
 * En uzun etiket (Consistency / İstikrar) yatayda yeri bol olan üst köşede durur.
 */
export const RADAR_ORDER: StatKey[] = ["con", "com", "exp", "rep", "act", "imp"]

/**
 * Her stat logaritmik ölçekte `fullAt` değerinde tavan yapar.
 * Tavanlar dünyanın en uç profillerine göre seçildi (ör. 300 bin takipçi, 500 bin yıldız):
 * 99 yalnızca gerçekten benzersiz değerlerde çıkar, güçlü profiller 85-95 bandına yayılır.
 */

/**
 * `soft`: logaritmanın ilk basamağı. 1 olunca birkaç katkı bile yüksek puan getirir;
 * büyüdükçe azalan getiri korunur ama küçük değerler hak ettiğinden fazla puan almaz.
 */

/**
 * Son 1 yıl, katkı takviminden. Bir günün katkısı `dailyCap` ile sınırlanır:
 * otomatik commit yağmuru (günde yüzlerce) aktiviteyi şişirmez.
 * Tek bir repoda yılda `repoYearCap` üstü commit (her gün ~14) bot işi sayılır; takvimin o payı düşülür.
 */
export const ACT = {
  contributions: { max: 100, fullAt: 10_000, soft: 25 },
  dailyCap: 40,
  repoYearCap: 5_000
}

/**
 * Kendi repoları tam, organizasyon repoları commit payı kadar. Pay, son bir yılın ve bütün geçmişin
 * payından büyüğüdür: projeyi kuran da bugün yürüten de payını alır. Yapay zekâ ajanı ve bot
 * commit'leri paydadan düşülür.
 */
export const IMP = {
  stars: { max: 75, fullAt: 500_000 },
  forks: { max: 25, fullAt: 100_000 },
  /** Commit payının paydası en az bu kadar sayılır. */
  minShareBase: 20,
  /** Bu commit payına ulaşılan organizasyon, Saygınlık'ta maintainer olunan organizasyon sayılır. */
  maintainerShare: 0.25
}

export const COM = {
  followers: { max: 100, fullAt: 300_000, soft: 10 }
}

/**
 * Başkasının kodunu kabul etmesi: kodu okumadan elde edilebilecek en güçlü güven sinyali.
 * PR ve review ikisi de ömür boyu. Maintainer olunan organizasyondaki PR'lar `ownOrgPrWeight` ile sayılır:
 * o repoların yıldızı zaten Etki'ye yazılıyor ve birleştiren çoğu zaman kişinin kendisi.
 */
export const REP = {
  externalPrs: { max: 60, fullAt: 2_000 },
  reviews: { max: 40, fullAt: 10_000 },
  ownOrgPrWeight: 0.5
}

/** İçinde bulunulan yıl için `minContributions` yılın geçen kısmı oranında istenir. */
export const CON = {
  activeDays: { max: 50, fullAt: 365 },
  streak: { max: 25, fullAt: 365 },
  years: { max: 25, span: 5, minContributions: 50 }
}

/**
 * Kıdem hesap yaşından değil, gerçekten üretilen yıllardan gelir: boş duran eski hesap kıdemli sayılmaz.
 * Toplam katkıda her yıl `yearCap` ile sınırlanır.
 */
export const EXP = {
  lifetime: { max: 60, fullAt: 100_000, soft: 10, yearCap: 10_000 },
  activeYears: { max: 40, fullAt: 15, minContributions: 50 }
}

/** Rozetler için commit örneklemi. */
export const COMMIT_SAMPLE_SIZE = 300

export const ACTIVE_REPOS = {
  /** Son bir yılda en az bu kadar commit atılan başka sahipli repolar aktif sayılır. */
  contributedMinCommits: 10,
  max: 30
}

export const LANGUAGE_MIN_SHARE = 0.05

/**
 * Ham puanı (0-100) FIFA ölçeğine yayan eğri: [ham, gösterilen] noktaları arasında doğrusal.
 * FIFA'da olduğu gibi aktif oyuncular 70-85 bandında toplanır, 90+ en iyilere kalır.
 * Ham sıralama değişmez; yalnızca gösterilen sayı değişir.
 */
export const DISPLAY_CURVE: [number, number][] = [
  [0, 30],
  [20, 55],
  [38, 70],
  [57, 81],
  [70, 86],
  [82, 90],
  [100, 99]
]

export const RARITY_THRESHOLDS: { rarity: Rarity; min: number }[] = [
  { rarity: "icon", min: 90 },
  { rarity: "gold", min: 75 },
  { rarity: "silver", min: 65 },
  { rarity: "bronze", min: 0 }
]

/** Dil → mevki grubu. Listede olmayan diller mevki hesabına girmez. */
export const LANGUAGE_GROUPS: Record<string, Exclude<Position, "Full Stack">> = {
  TypeScript: "Frontend",
  JavaScript: "Frontend",
  CSS: "Frontend",
  SCSS: "Frontend",
  Sass: "Frontend",
  Less: "Frontend",
  HTML: "Frontend",
  Vue: "Frontend",
  Svelte: "Frontend",
  Astro: "Frontend",
  MDX: "Frontend",
  Go: "Backend",
  Java: "Backend",
  Python: "Backend",
  PHP: "Backend",
  Ruby: "Backend",
  Elixir: "Backend",
  Scala: "Backend",
  Clojure: "Backend",
  Shell: "DevOps",
  HCL: "DevOps",
  Dockerfile: "DevOps",
  Nix: "DevOps",
  PowerShell: "DevOps",
  Makefile: "DevOps",
  Swift: "Mobile",
  Kotlin: "Mobile",
  Dart: "Mobile",
  "Objective-C": "Mobile",
  "Jupyter Notebook": "Data",
  R: "Data",
  Cuda: "Data",
  MATLAB: "Data",
  Julia: "Data",
  C: "Systems",
  "C++": "Systems",
  Rust: "Systems",
  Zig: "Systems",
  Assembly: "Systems",
  "C#": "Backend",
  GDScript: "Game Dev",
  ShaderLab: "Game Dev",
  HLSL: "Game Dev"
}

/** Frontend ve Backend payları bu oranı geçerse Full Stack. */
export const FULL_STACK_MIN_SHARE = 0.3

/** Football Manager tarzı renk kademeleri: değer bu eşiğe eşit ya da üstündeyse o kademe. */
export const STAT_TIERS = [
  { tier: "elite", min: 90 },
  { tier: "great", min: 80 },
  { tier: "good", min: 70 },
  { tier: "fair", min: 60 },
  { tier: "poor", min: 0 }
] as const

export type StatTier = (typeof STAT_TIERS)[number]["tier"]

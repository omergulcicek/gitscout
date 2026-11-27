/** Bayrağı gösterilen ülkeler. Yeni ülke eklenince bayrağı `COUNTRY_FLAGS` içine de eklenir. */
export const COUNTRIES = [
  "TR",
  "AR",
  "AT",
  "AU",
  "BD",
  "BE",
  "BR",
  "CA",
  "CN",
  "CO",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "HR",
  "ID",
  "IE",
  "IL",
  "IN",
  "IT",
  "JP",
  "KR",
  "MY",
  "NG",
  "NL",
  "NO",
  "PK",
  "PL",
  "PT",
  "RO",
  "RU",
  "SE",
  "SG",
  "SI",
  "SK",
  "TW",
  "UA",
  "US",
  "VE",
  "VN"
] as const

export type CountryCode = (typeof COUNTRIES)[number]

/** Ülkesi listede olmayan oyuncular ülke filtresinde bu değerle seçilir. */
export const UNKNOWN_COUNTRY = "unknown"

export type CountryFilter = CountryCode | typeof UNKNOWN_COUNTRY

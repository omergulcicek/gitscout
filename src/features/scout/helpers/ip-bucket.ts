/** IPv6 adresinin sayılan ön eki: /64, yani ilk dört grup. */
const IPV6_PREFIX_GROUPS = 4

/** IPv6 adresini sekiz gruplu tam biçime açar; geçersizse `null`. */
function expandIpv6(ip: string): string[] | null {
  const halves = ip.split("::")
  if (halves.length > 2) return null
  const [head = "", tail] = halves
  const left = head ? head.split(":") : []
  const right = tail ? tail.split(":") : []
  const missing = 8 - left.length - right.length
  if (tail === undefined ? missing !== 0 : missing < 1) return null
  const groups = [
    ...left,
    ...Array.from({ length: tail === undefined ? 0 : missing }, () => "0"),
    ...right
  ]
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null
  return groups.map((group) => group.padStart(4, "0"))
}

/**
 * Kart ekleme sınırının saydığı kimlik. IPv4 adresi olduğu gibi kalır. IPv6'da bir bağlantıya genellikle
 * koca bir /64 bloğu verilir ve adres bu blok içinde serbestçe değiştirilebilir; bu yüzden blok sayılır.
 * IPv6 içine gömülü IPv4 (`::ffff:1.2.3.4`) IPv4 sayılır. Boş ya da tanınmayan değer ortak bir kovaya düşer.
 */
export function ipBucket(ip: string | undefined): string {
  const value = (ip ?? "").trim().toLowerCase()
  if (!value) return "unknown"
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value)
  if (mapped?.[1]) return mapped[1]
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return value
  const groups = expandIpv6(value.split("%")[0] ?? "")
  if (!groups) return "unknown"
  return `${groups.slice(0, IPV6_PREFIX_GROUPS).join(":")}::/64`
}

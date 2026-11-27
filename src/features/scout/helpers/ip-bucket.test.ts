import { describe, expect, it } from "vitest"

import { ipBucket } from "@/features/scout/helpers/ip-bucket"

describe("ipBucket", () => {
  it("IPv4 adresini olduğu gibi bırakır", () => {
    expect(ipBucket("203.0.113.7")).toBe("203.0.113.7")
  })

  it("IPv6 adresini /64 bloğuna indirger", () => {
    expect(ipBucket("2001:db8:1:2:aaaa::1")).toBe("2001:0db8:0001:0002::/64")
    expect(ipBucket("2001:DB8:1:2:ffff:ffff:ffff:ffff")).toBe("2001:0db8:0001:0002::/64")
  })

  it("aynı bloktaki farklı adresleri aynı kovaya koyar", () => {
    expect(ipBucket("2001:db8:1:2::1")).toBe(ipBucket("2001:db8:1:2:9:9:9:9"))
    expect(ipBucket("2001:db8:1:2::1")).not.toBe(ipBucket("2001:db8:1:3::1"))
  })

  it("IPv6 içindeki IPv4 adresini IPv4 sayar", () => {
    expect(ipBucket("::ffff:203.0.113.7")).toBe("203.0.113.7")
  })

  it("yerel adresleri ve bölge ekini işler", () => {
    expect(ipBucket("::1")).toBe("0000:0000:0000:0000::/64")
    expect(ipBucket("fe80::1%en0")).toBe("fe80:0000:0000:0000::/64")
  })

  it("boş ya da geçersiz değeri ortak kovaya düşürür", () => {
    expect(ipBucket(undefined)).toBe("unknown")
    expect(ipBucket("")).toBe("unknown")
    expect(ipBucket("not-an-ip")).toBe("unknown")
    expect(ipBucket("1::2::3")).toBe("unknown")
  })
})

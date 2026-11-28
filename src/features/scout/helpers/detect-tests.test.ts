import { describe, expect, it } from "vitest"

import { detectCi, detectTests } from "@/features/scout/helpers/detect-tests"

describe("detectTests", () => {
  it("detects test directories and config files in root entries", () => {
    expect(detectTests(null, ["src", "tests"])).toBe(true)
    expect(detectTests(null, ["__tests__"])).toBe(true)
    expect(detectTests(null, ["pytest.ini"])).toBe(true)
    expect(detectTests(null, ["vitest.config.ts"])).toBe(true)
    expect(detectTests(null, ["src", "README.md"])).toBe(false)
  })

  it("detects test packages in dependencies and devDependencies", () => {
    expect(detectTests(JSON.stringify({ devDependencies: { vitest: "^5.0.0" } }), [])).toBe(true)
    expect(
      detectTests(JSON.stringify({ dependencies: { "@testing-library/react": "^16.0.0" } }), [])
    ).toBe(true)
    expect(detectTests(JSON.stringify({ devDependencies: { eslint: "^10.0.0" } }), [])).toBe(false)
  })

  it("detects a real scripts.test command and ignores npm's default placeholder", () => {
    expect(detectTests(JSON.stringify({ scripts: { test: "vitest run" } }), [])).toBe(true)
    expect(
      detectTests(
        JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }),
        []
      )
    ).toBe(false)
  })

  it("returns false for null, malformed JSON, or non-object JSON values", () => {
    expect(detectTests(null, [])).toBe(false)
    expect(detectTests("{broken", [])).toBe(false)
    expect(detectTests("null", [])).toBe(false)
    expect(detectTests("123", [])).toBe(false)
  })
})

describe("detectCi", () => {
  it("detects YAML workflow files case-insensitively", () => {
    expect(detectCi(["ci.yml"])).toBe(true)
    expect(detectCi(["deploy.YAML"])).toBe(true)
    expect(detectCi(["README.md", "notes.txt"])).toBe(false)
    expect(detectCi([])).toBe(false)
  })
})

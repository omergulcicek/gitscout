import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Gender } from "@/constants/account.constants"
import type { Team } from "@/constants/team.constants"

import {
  getPlayersByLogin,
  searchPlayers,
  updateBirthDate,
  updateProfileCountry,
  updateProfileDetails
} from "@/features/scout/api/players.functions"
import { ProfileForm } from "@/features/scout/components/ProfileForm"
import { useProfileForm } from "@/features/scout/hooks/use-profile-form"
import type { ListPlayer } from "@/features/scout/types/player.types"
import { renderWithProviders } from "@/test/render"

vi.mock("@/features/scout/api/players.functions", () => ({
  getPlayersByLogin: vi.fn(),
  searchPlayers: vi.fn(),
  updateBirthDate: vi.fn(),
  updateProfileCountry: vi.fn(),
  updateProfileDetails: vi.fn()
}))

const player = (login: string) =>
  ({ login, name: login, avatarUrl: "", ovr: 70, rarity: "silver" }) as ListPlayer

type Saved = {
  city?: string | null
  gender?: Gender | null
  dreamTeam?: string[]
  favoriteTeam?: Team | null
}

function Harness({ city = null, gender = null, dreamTeam = [], favoriteTeam = null }: Saved) {
  const form = useProfileForm({ birthDate: null, city, gender, dreamTeam, favoriteTeam })
  return <ProfileForm form={form} login="me" birthDate={null} birthDateChangesLeft={2} />
}

function renderForm(saved: Saved = {}) {
  const user = userEvent.setup()
  renderWithProviders(<Harness {...saved} />)
  return user
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const players = [player("me"), player("ada"), player("linus")]
    // Mirrors the server: match by login, leave out excluded logins.
    vi.mocked(searchPlayers).mockImplementation((({
      data
    }: {
      data: { q: string; exclude: string[] }
    }) =>
      Promise.resolve(
        players.filter(
          (entry) =>
            entry.login.includes(data.q.toLowerCase()) && !data.exclude.includes(entry.login)
        )
      )) as unknown as typeof searchPlayers)
    vi.mocked(getPlayersByLogin).mockImplementation(({ data }: { data: { logins: string[] } }) =>
      Promise.resolve(players.filter((entry) => data.logins.includes(entry.login)))
    )
    vi.mocked(updateProfileDetails).mockResolvedValue(undefined)
  })

  it("tek kaydette yalnızca değişen alanı gönderir", async () => {
    const user = renderForm()

    await user.type(screen.getByLabelText("City"), "İzmir")
    await user.click(screen.getByRole("button", { name: "Save" }))

    // Doğrulama eşzamansız: kayıt isteği tıklamadan bir süre sonra gider.
    await waitFor(() =>
      expect(updateProfileDetails).toHaveBeenCalledWith({ data: { city: "İzmir" } })
    )
    expect(updateProfileCountry).not.toHaveBeenCalled()
    expect(updateBirthDate).not.toHaveBeenCalled()
  })

  it("şehir alanına rakam ve işaret yazılamaz", async () => {
    const user = renderForm()
    const city = screen.getByLabelText("City")

    await user.type(city, "İz3mir!")

    expect(city).toHaveValue("İzmir")
  })

  it("değişiklik yokken kaydet kapalıdır", () => {
    renderForm({ city: "İzmir" })

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("kadro beş kişiyle dolar ve arama kutusu kalkar", () => {
    renderForm({ dreamTeam: ["a", "b", "c", "d", "e"] })

    expect(screen.getByText("Your team is full.")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Search and add a developer")).not.toBeInTheDocument()
  })

  it("kişi kendini rüya takımında bulamaz", async () => {
    const user = renderForm()

    await user.click(screen.getByPlaceholderText("Search and add a developer"))

    expect(await screen.findByRole("option", { name: /ada/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /@me/ })).not.toBeInTheDocument()
  })

  it("cinsiyet ve kadroya eklenen oyuncu tek istekte gönderilir", async () => {
    const user = renderForm()

    await user.click(screen.getByRole("radio", { name: "Woman" }))
    await user.click(screen.getByPlaceholderText("Search and add a developer"))
    await user.click(await screen.findByRole("option", { name: /ada/ }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(updateProfileDetails).toHaveBeenCalledWith({
        data: { gender: "female", dreamTeam: ["ada"] }
      })
    )
  })

  it("favori takım seçimi ve kaldırılması kaydedilir", async () => {
    const user = renderForm()

    await user.click(screen.getByRole("button", { name: /^Your favorite team/ }))
    await user.click(await screen.findByRole("menuitem", { name: "Turkey" }))
    // Alt menü açıkken Base UI üst menüye geçici olarak pointer-events: none verir; jsdom'da bu kontrol kapatılır.
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(await screen.findByRole("menuitemradio", { name: "Beşiktaş" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(updateProfileDetails).toHaveBeenCalledWith({ data: { favoriteTeam: "besiktas" } })
    )

    await user.click(screen.getByRole("button", { name: /^Your favorite team/ }))
    await user.click(await screen.findByRole("menuitemradio", { name: "No team" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(updateProfileDetails).toHaveBeenLastCalledWith({ data: { favoriteTeam: null } })
    )
  })

  it("favori takım seçiliyken takım kartı kalıcı kart olarak kaydedilir", async () => {
    const user = renderForm({ favoriteTeam: "besiktas" })

    // GitHub Stars programında olmayan kişiye GitHub Star seçeneği gösterilmez.
    expect(screen.queryByRole("radio", { name: "GitHub Star card" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("radio", { name: "Team card (Beşiktaş)" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(updateProfileDetails).toHaveBeenCalledWith({ data: { cardFace: "team" } })
    )
  })

  it("favori takım yokken takım kartı seçilemez", async () => {
    const user = renderForm()
    const teamCard = screen.getByRole("radio", { name: /Team card/ })

    await user.click(teamCard)

    expect(teamCard).not.toBeChecked()
    expect(screen.getByRole("radio", { name: "Real card" })).toBeChecked()
  })

  it("arama kutusunda Enter formu göndermez", async () => {
    const user = renderForm()

    await user.type(screen.getByLabelText("City"), "İzmir")
    await user.type(screen.getByPlaceholderText("Search and add a developer"), "zzz{Enter}")
    // Doğrulama eşzamansız biter; gönderim olsaydı bu bekleme içinde istek giderdi.
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(updateProfileDetails).not.toHaveBeenCalled()
    // Form hâlâ kaydedilmemiş değişiklik taşır.
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  })
})

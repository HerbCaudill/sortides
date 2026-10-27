import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { OutingPhoto } from "../OutingPhoto"

afterEach(cleanup)
describe("outing photos", () => {
  it("shows an available photo with attribution and hides a failed image", () => {
    render(
      <OutingPhoto
        photo={{
          url: "/photos/place.webp",
          alt: "Stone bridge",
          credit: "Photographer",
          sourceUrl: "https://commons.wikimedia.org/",
          license: "CC BY-SA 3.0",
          licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        }}
      />,
    )
    expect(screen.getByRole("link", { name: "Photographer" })).toHaveAttribute(
      "href",
      "https://commons.wikimedia.org/",
    )
    fireEvent.error(screen.getByAltText("Stone bridge"))
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })
})

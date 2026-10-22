import { describe, expect, it } from "vitest"
import { ColumnOption, resolveLayout, toSavedLayout } from "./use-table-layout"

const columns: ColumnOption[] = [
  { id: "name", label: "Name", required: true },
  { id: "status", label: "Status" },
  { id: "reports", label: "Reports" },
  { id: "lastLogin", label: "Last Login", defaultHidden: true },
]

const ids = (layout: ReturnType<typeof resolveLayout>) => layout.map((c) => c.id)
const visible = (layout: ReturnType<typeof resolveLayout>) => layout.filter((c) => c.visible).map((c) => c.id)

describe("resolveLayout", () => {
  it("uses the default order and visibility when nothing is saved", () => {
    const layout = resolveLayout(columns, null)
    expect(ids(layout)).toEqual(["name", "status", "reports", "lastLogin"])
    expect(visible(layout)).toEqual(["name", "status", "reports"])
  })

  it("applies a saved order and hidden set", () => {
    const layout = resolveLayout(columns, { order: ["reports", "name", "lastLogin", "status"], hidden: ["status"] })
    expect(ids(layout)).toEqual(["reports", "name", "lastLogin", "status"])
    expect(visible(layout)).toEqual(["reports", "name", "lastLogin"])
  })

  it("never hides a required column", () => {
    const layout = resolveLayout(columns, { order: ["name", "status", "reports", "lastLogin"], hidden: ["name"] })
    expect(visible(layout)).toContain("name")
  })

  it("appends columns added since the layout was saved, with their defaults", () => {
    const layout = resolveLayout(columns, { order: ["status", "name"], hidden: [] })
    expect(ids(layout)).toEqual(["status", "name", "reports", "lastLogin"])
    expect(visible(layout)).toEqual(["status", "name", "reports"])
  })

  it("drops columns that no longer exist", () => {
    const layout = resolveLayout(columns, { order: ["gone", "name", "status", "reports", "lastLogin"], hidden: ["gone"] })
    expect(ids(layout)).toEqual(["name", "status", "reports", "lastLogin"])
  })

  it("round-trips through toSavedLayout", () => {
    const layout = resolveLayout(columns, { order: ["reports", "name", "status", "lastLogin"], hidden: ["status"] })
    expect(resolveLayout(columns, toSavedLayout(layout))).toEqual(layout)
  })
})

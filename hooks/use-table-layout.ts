"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import { AdminPreferences, getAdminPreferences, setAdminPreference } from "@/lib/api"

export type ColumnOption = {
  id: string
  label: string
  // Always shown (e.g. the name column); can still be moved.
  required?: boolean
  // Off until the admin turns it on.
  defaultHidden?: boolean
}

// What gets saved. `order` lists every column the admin had when they last
// saved, so a column added later is recognisable as new and gets its default.
export type SavedTableLayout = { order: string[]; hidden: string[] }

export type ResolvedColumn = ColumnOption & { visible: boolean }

const PREFERENCES_KEY = ["admin-preferences"]
const SAVE_DELAY_MS = 500

export function resolveLayout(columns: ColumnOption[], saved?: Partial<SavedTableLayout> | null): ResolvedColumn[] {
  const byId = new Map(columns.map((column) => [column.id, column]))
  const savedOrder = Array.isArray(saved?.order) ? saved.order.filter((id) => byId.has(id)) : []
  const known = new Set(savedOrder)
  const hidden = new Set(Array.isArray(saved?.hidden) ? saved.hidden : [])

  // Saved order first, then columns the admin has never seen, in their default spot.
  const ordered = [...savedOrder, ...columns.map((column) => column.id).filter((id) => !known.has(id))]

  return ordered.map((id) => {
    const column = byId.get(id)!
    const visible = column.required || (known.has(id) ? !hidden.has(id) : !column.defaultHidden)
    return { ...column, visible }
  })
}

export function toSavedLayout(columns: ResolvedColumn[]): SavedTableLayout {
  return {
    order: columns.map((column) => column.id),
    hidden: columns.filter((column) => !column.visible).map((column) => column.id),
  }
}

export function useTableLayout(tableId: string, columns: ColumnOption[]) {
  const queryClient = useQueryClient()
  const prefKey = `table:${tableId}`
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: preferences, isLoading } = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: getAdminPreferences,
    staleTime: Infinity,
  })

  const saved = preferences?.[prefKey] as Partial<SavedTableLayout> | undefined
  const layout = useMemo(() => resolveLayout(columns, saved), [columns, saved])

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  // Optimistic: the table changes immediately, the save is debounced so a
  // burst of clicks or drags becomes one request.
  const persist = useCallback((value: SavedTableLayout | null) => {
    queryClient.setQueryData<AdminPreferences>(PREFERENCES_KEY, (current) => {
      const next = { ...(current ?? {}) }
      if (value) next[prefKey] = value
      else delete next[prefKey]
      return next
    })
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setAdminPreference(prefKey, value).catch(() => {
        toast({ title: "Couldn't save your columns", description: "Your layout will reset when you reload.", variant: "destructive" })
        queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY })
      })
    }, SAVE_DELAY_MS)
  }, [prefKey, queryClient])

  const setLayout = useCallback((next: ResolvedColumn[]) => persist(toSavedLayout(next)), [persist])
  const resetLayout = useCallback(() => persist(null), [persist])

  return {
    layout,
    visibleColumns: layout.filter((column) => column.visible),
    setLayout,
    resetLayout,
    isCustomised: !!saved,
    isLoading,
  }
}

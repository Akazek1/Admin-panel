"use client"

import React, { useCallback, useEffect, useState } from "react"
import axiosInstance from "@/lib/axios-instance"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { ArrowDown, ArrowUp, FileText, Loader2, Plus, Save, Trash2 } from "lucide-react"

type LegalType = "terms" | "privacy"

interface Section {
  id: number
  title: string
  content: string
}

interface LegalDoc {
  type: string
  title: string
  intro: string | null
  sections: Section[]
  version: number
  effectiveDate: string | null
  updatedAt: string | null
}

const TYPE_LABEL: Record<LegalType, string> = {
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
}

// Languages a legal document can be published in. English is the source/fallback;
// other locales are optional translations that fall back to English in the app
// until they are filled in. Keep in sync with the app's active languages.
const LEGAL_LOCALES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "rw", label: "Kinyarwanda" },
]

function LegalEditor({ type, locale }: { type: LegalType; locale: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [intro, setIntro] = useState("")
  const [sections, setSections] = useState<Section[]>([])
  const [meta, setMeta] = useState<{ version?: number; effectiveDate?: string | null } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get(`/admin/legal/${type}`, { params: { locale } })
      const doc: LegalDoc | null = res.data?.data ?? res.data ?? null
      if (doc) {
        setTitle(doc.title || TYPE_LABEL[type])
        setIntro(doc.intro || "")
        setSections(Array.isArray(doc.sections) ? doc.sections : [])
        setMeta({ version: doc.version, effectiveDate: doc.effectiveDate })
      } else {
        setTitle(TYPE_LABEL[type])
        setIntro("")
        setSections([])
        setMeta(null)
      }
    } catch {
      toast({ title: "Could not load document", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [type, locale])

  useEffect(() => {
    void load()
  }, [load])

  const updateSection = (index: number, patch: Partial<Section>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const addSection = () => {
    setSections((prev) => [...prev, { id: prev.length + 1, title: "", content: "" }])
  }

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, id: i + 1 })))
  }

  const moveSection = (index: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, id: i + 1 }))
    })
  }

  const save = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" })
      return
    }
    if (sections.some((s) => !s.title.trim() || !s.content.trim())) {
      toast({ title: "Every section needs a title and content", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await axiosInstance.patch(
        `/admin/legal/${type}`,
        {
          title: title.trim(),
          intro: intro.trim() || null,
          // Re-number to keep the displayed ordinals consistent.
          sections: sections.map((s, i) => ({ id: i + 1, title: s.title.trim(), content: s.content })),
        },
        { params: { locale } },
      )
      toast({ title: `${TYPE_LABEL[type]} published` })
      await load()
    } catch {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.version
            ? `Version ${meta.version}${meta.effectiveDate ? ` · effective ${formatDate(meta.effectiveDate)}` : ""}`
            : "Not published yet — saving will publish version 1."}
        </p>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Publish changes
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Document title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={TYPE_LABEL[type]} />
          </div>
          <div className="space-y-2">
            <Label>Introduction (optional)</Label>
            <Textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="Short paragraph shown above the sections."
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Section {index + 1}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => moveSection(index, -1)} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(index, 1)}
                    disabled={index === sections.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeSection(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <Input
                value={section.title}
                onChange={(e) => updateSection(index, { title: e.target.value })}
                placeholder="Section title"
              />
              <Textarea
                value={section.content}
                onChange={(e) => updateSection(index, { content: e.target.value })}
                rows={5}
                placeholder="Section content"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addSection} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add section
      </Button>
    </div>
  )
}

export default function LegalDocumentsPage() {
  const [tab, setTab] = useState<LegalType>("terms")
  const [locale, setLocale] = useState<string>("en")

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Legal Documents</h1>
          <p className="text-sm text-muted-foreground">
            Edit the Terms &amp; Conditions and Privacy Policy shown in the app. Changes publish immediately.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Language:</span>
        <div className="inline-flex rounded-md border p-1">
          {LEGAL_LOCALES.map((l) => (
            <Button
              key={l.code}
              variant={locale === l.code ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocale(l.code)}
            >
              {l.label}
            </Button>
          ))}
        </div>
        {locale !== "en" && (
          <span className="text-xs text-muted-foreground">
            Optional translation — falls back to English in the app until published.
          </span>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as LegalType)}>
        <TabsList>
          <TabsTrigger value="terms">Terms &amp; Conditions</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
        </TabsList>
        <TabsContent value="terms" className="mt-4">
          <LegalEditor type="terms" locale={locale} />
        </TabsContent>
        <TabsContent value="privacy" className="mt-4">
          <LegalEditor type="privacy" locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

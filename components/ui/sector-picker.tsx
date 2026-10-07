"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Crosshair, Hash, Loader2, MapPin, X } from "lucide-react";
import {
  RWANDA_PROVINCES,
  RwandaCell,
  RwandaSector,
  ViewerLocation,
  cellsBySectorPcode,
  districtsByProvince,
  sectorsByDistrict,
} from "@/constants/rwanda-sectors";
import {
  reverseGeocode,
  villagesByCellPcode,
  type RwandaVillage,
} from "@/constants/rwanda-villages";

interface Props {
  value: ViewerLocation | null;
  onChange: (loc: ViewerLocation) => void;
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = "province" | "district" | "sector" | "cell" | "village";
type InputMode = "pick" | "gps" | "coords";

const byProvince = districtsByProvince();
const byDistrict = sectorsByDistrict();
const byPcode    = cellsBySectorPcode();

export function SectorPicker({
  value,
  onChange,
  placeholder = "Select neighborhood",
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep]               = useState<Step>("province");
  const [selProvince, setSelProvince] = useState<string | null>(null);
  const [selDistrict, setSelDistrict] = useState<string | null>(null);
  const [selSector,   setSelSector]   = useState<RwandaSector | null>(null);
  const [selCell,     setSelCell]     = useState<RwandaCell | null>(null);

  const [villagesMap, setVillagesMap]         = useState<Map<string, RwandaVillage[]> | null>(null);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [inputMode, setInputMode] = useState<InputMode>("pick");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [gpsError, setGpsError]   = useState<string>("");
  const [coordLat, setCoordLat]   = useState("");
  const [coordLng, setCoordLng]   = useState("");
  const [coordStatus, setCoordStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [coordPreview, setCoordPreview] = useState<ViewerLocation | null>(null);
  const latRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (v: boolean) => {
    if (!v) {
      setStep("province");
      setSelProvince(null); setSelDistrict(null); setSelSector(null); setSelCell(null);
      setInputMode("pick");
      setGpsStatus("idle"); setGpsError("");
      setCoordLat(""); setCoordLng(""); setCoordStatus("idle"); setCoordPreview(null);
    }
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  useEffect(() => {
    if (step === "cell" && villagesMap === null && !loadingVillages) {
      setLoadingVillages(true);
      villagesByCellPcode().then((m) => {
        setVillagesMap(m);
        setLoadingVillages(false);
      });
    }
  }, [step, villagesMap, loadingVillages]);

  const commit = (loc: ViewerLocation) => { onChange(loc); setOpen(false); };

  const ensureVillages = async () => {
    if (villagesMap) return villagesMap;
    setLoadingVillages(true);
    const m = await villagesByCellPcode();
    setVillagesMap(m);
    setLoadingVillages(false);
    return m;
  };

  const villageToLoc = (v: RwandaVillage): ViewerLocation => ({
    province: v.province, district: v.district, sector: v.sector,
    cell: v.cell, village: v.village, lat: v.lat, lng: v.lng,
  });

  const useGps = () => {
    setInputMode("gps");
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = await reverseGeocode(latitude, longitude);
        if (nearest) {
          commit(villageToLoc(nearest));
        } else {
          setGpsStatus("error");
          setGpsError("No matching location found.");
        }
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(err.code === 1 ? "Location permission denied." : "GPS lookup failed.");
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const switchToCoords = () => {
    setInputMode("coords");
    setTimeout(() => latRef.current?.focus(), 80);
  };

  const findByCoords = async () => {
    const lat = parseFloat(coordLat);
    const lng = parseFloat(coordLng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -4 || lat > 0 || lng < 28 || lng > 32) {
      setCoordStatus("error");
      return;
    }
    setCoordStatus("loading");
    const nearest = await reverseGeocode(lat, lng);
    if (nearest) {
      setCoordPreview(villageToLoc(nearest));
      setCoordStatus("found");
    } else {
      setCoordStatus("error");
    }
  };

  const pickProvince = (p: string) => { setSelProvince(p); setStep("district"); };
  const pickDistrict = (d: string) => { setSelDistrict(d); setStep("sector"); };

  const pickSector = (s: RwandaSector) => {
    setSelSector(s);
    const cells = byPcode.get(s.pcode) ?? [];
    if (cells.length === 0) {
      commit({ province: s.province, district: s.district, sector: s.sector, lat: s.lat, lng: s.lng });
    } else {
      setStep("cell");
    }
  };

  const pickCell = (c: RwandaCell) => {
    setSelCell(c);
    const villages = villagesMap?.get(c.pcode) ?? [];
    if (villages.length > 0) {
      setStep("village");
    } else {
      if (villagesMap === null) {
        setLoadingVillages(true);
        villagesByCellPcode().then((m) => {
          setVillagesMap(m);
          setLoadingVillages(false);
          if ((m.get(c.pcode) ?? []).length > 0) setStep("village");
          else commit({ province: c.province, district: c.district, sector: c.sector, cell: c.cell, lat: c.lat, lng: c.lng });
        });
      } else {
        commit({ province: c.province, district: c.district, sector: c.sector, cell: c.cell, lat: c.lat, lng: c.lng });
      }
    }
  };

  const pickVillage = (v: RwandaVillage) => {
    commit({ province: v.province, district: v.district, sector: v.sector, cell: v.cell, village: v.village, lat: v.lat, lng: v.lng });
  };

  const useSector = () => {
    if (!selSector) return;
    commit({ province: selSector.province, district: selSector.district, sector: selSector.sector, lat: selSector.lat, lng: selSector.lng });
  };

  const useCell = () => {
    if (!selCell) return;
    commit({ province: selCell.province, district: selCell.district, sector: selCell.sector, cell: selCell.cell, lat: selCell.lat, lng: selCell.lng });
  };

  const back = () => {
    if      (step === "village")  { setStep("cell");     setSelCell(null); }
    else if (step === "cell")     { setStep("sector");   setSelSector(null); }
    else if (step === "sector")   { setStep("district"); setSelDistrict(null); }
    else if (step === "district") { setStep("province"); setSelProvince(null); }
  };

  const stepTitle: Record<Step, string> = {
    province: "Select Province",
    district: `Select District — ${selProvince ?? ""}`,
    sector:   `Select Sector — ${selDistrict ?? ""}`,
    cell:     `Select Cell — ${selSector?.sector ?? ""}`,
    village:  `Select Village — ${selCell?.cell ?? ""}`,
  };

  const stepHint: Record<Step, string> = {
    province: "Choose the province",
    district: "Choose the district",
    sector:   "Choose the sector, or go deeper",
    cell:     "Choose the cell, or go deeper",
    village:  "Choose the village for the most precise location",
  };

  const displayLabel = value
    ? value.village
      ? `${value.village}, ${value.cell}`
      : value.cell
        ? `${value.cell}, ${value.sector}`
        : value.sector
    : null;

  const displaySub = value ? `${value.district}, ${value.province}` : null;

  const cells    = selSector ? (byPcode.get(selSector.pcode) ?? []) : [];
  const villages = selCell   ? (villagesMap?.get(selCell.pcode) ?? []) : [];

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            {displayLabel ? (
              <span className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">{displayLabel}</span>
                <span className="text-xs text-muted-foreground truncate">{displaySub}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <span className="ml-2 flex-shrink-0 text-xs font-semibold text-primary">
            {displayLabel ? "Change" : "Select"}
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative z-10 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-background p-5 shadow-xl mx-4">

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {inputMode !== "pick" ? (
                  <button type="button" onClick={() => { setInputMode("pick"); setGpsStatus("idle"); setCoordStatus("idle"); setCoordPreview(null); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : step !== "province" ? (
                  <button type="button" onClick={back}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <div>
                  <p className="text-sm font-bold">
                    {inputMode === "gps" ? "Using GPS" : inputMode === "coords" ? "Enter Coordinates" : stepTitle[step]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inputMode === "pick" ? stepHint[step] : ""}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                <X className="h-4 w-4" />
              </button>
            </div>

            {inputMode === "pick" && step === "province" && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={useGps}
                  className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary">
                  <Crosshair className="h-3.5 w-3.5 flex-shrink-0" />
                  Use GPS
                </button>
                <button type="button" onClick={switchToCoords}
                  className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary">
                  <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                  Enter Coordinates
                </button>
              </div>
            )}

            {inputMode === "gps" && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                {gpsStatus === "loading" && (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-semibold">Getting location…</p>
                    <p className="text-xs text-muted-foreground">Allow location access when prompted.</p>
                  </>
                )}
                {gpsStatus === "error" && (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <Crosshair className="h-6 w-6 text-destructive" />
                    </div>
                    <p className="text-sm font-semibold">Location unavailable</p>
                    <p className="max-w-[260px] text-xs leading-5 text-muted-foreground">{gpsError}</p>
                    <button type="button" onClick={() => { setGpsStatus("idle"); setInputMode("pick"); }}
                      className="mt-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground">
                      Pick manually
                    </button>
                  </>
                )}
              </div>
            )}

            {inputMode === "coords" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Enter latitude and longitude coordinates for Rwanda.</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Latitude</span>
                    <input ref={latRef} type="number" step="any" placeholder="-1.9441" value={coordLat}
                      onChange={(e) => { setCoordLat(e.target.value); setCoordStatus("idle"); setCoordPreview(null); }}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Longitude</span>
                    <input type="number" step="any" placeholder="30.0588" value={coordLng}
                      onChange={(e) => { setCoordLng(e.target.value); setCoordStatus("idle"); setCoordPreview(null); }}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                  </label>
                </div>
                {coordStatus === "error" && <p className="text-xs font-semibold text-destructive">Invalid coordinates for Rwanda.</p>}
                {coordStatus === "found" && coordPreview && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                    <p className="text-xs font-bold uppercase text-primary">Nearest found</p>
                    <p className="text-sm font-bold">{coordPreview.village}, {coordPreview.cell}</p>
                    <p className="text-xs text-muted-foreground">{coordPreview.sector}, {coordPreview.district}, {coordPreview.province}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={findByCoords}
                    disabled={coordStatus === "loading" || !coordLat || !coordLng}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50">
                    {coordStatus === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Finding…</> : "Find Location"}
                  </button>
                  {coordStatus === "found" && coordPreview && (
                    <button type="button" onClick={() => commit(coordPreview)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-primary bg-background py-2.5 text-xs font-bold text-primary hover:bg-primary/5">
                      <Check className="h-4 w-4" /> Use This
                    </button>
                  )}
                </div>
              </div>
            )}

            {inputMode === "pick" && step === "province" && (
              <div className="flex flex-col gap-2">
                {RWANDA_PROVINCES.map((p) => (
                  <button key={p} type="button" onClick={() => pickProvince(p)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition ${
                      value?.province === p ? "border-primary bg-primary/5 text-primary" : "border-input bg-background hover:border-primary/50"
                    }`}>
                    <span>{p}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {byProvince.get(p)?.length ?? 0} districts →
                    </span>
                  </button>
                ))}
              </div>
            )}

            {inputMode === "pick" && step === "district" && selProvince && (
              <div className="grid grid-cols-2 gap-2">
                {(byProvince.get(selProvince) ?? []).map((d) => {
                  const active = value?.district === d && value?.province === selProvince;
                  return (
                    <button key={d} type="button" onClick={() => pickDistrict(d)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        active ? "border-primary bg-primary/5 text-primary" : "border-input bg-background hover:border-primary/50"
                      }`}>
                      <span>{d}</span>
                      {active && <Check className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {inputMode === "pick" && step === "sector" && selDistrict && (
              <div className="grid grid-cols-2 gap-2">
                {(byDistrict.get(selDistrict) ?? []).map((s) => {
                  const hasCells = (byPcode.get(s.pcode) ?? []).length > 0;
                  const active   = value?.sector === s.sector && value?.district === s.district && !value?.cell;
                  return (
                    <button key={s.sector} type="button" onClick={() => pickSector(s)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        active ? "border-primary bg-primary/5 text-primary" : "border-input bg-background hover:border-primary/50"
                      }`}>
                      <span>{s.sector}</span>
                      {active ? <Check className="h-4 w-4 flex-shrink-0" /> : hasCells && <span className="text-xs text-muted-foreground">▸</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {inputMode === "pick" && step === "cell" && selSector && (
              <>
                <button type="button" onClick={useSector}
                  className="mb-3 flex w-full items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-left text-sm transition hover:border-primary">
                  <span className="font-semibold text-primary">Use {selSector.sector} (sector level)</span>
                  <span className="text-xs text-muted-foreground">Less precise</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {cells.map((c) => {
                    const hasVillages = (villagesMap?.get(c.pcode) ?? []).length > 0;
                    const active      = value?.cell === c.cell && value?.sector === c.sector && !value?.village;
                    return (
                      <button key={c.cell} type="button" onClick={() => pickCell(c)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition ${
                          active ? "border-primary bg-primary/5 text-primary" : "border-input bg-background hover:border-primary/50"
                        }`}>
                        <span>{c.cell}</span>
                        {active ? <Check className="h-4 w-4 flex-shrink-0" /> : hasVillages && <span className="text-xs text-muted-foreground">▸</span>}
                      </button>
                    );
                  })}
                </div>
                {loadingVillages && <p className="mt-3 text-center text-xs text-muted-foreground">Loading villages…</p>}
              </>
            )}

            {inputMode === "pick" && step === "village" && selCell && (
              <>
                <button type="button" onClick={useCell}
                  className="mb-3 flex w-full items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-left text-sm transition hover:border-primary">
                  <span className="font-semibold text-primary">Use {selCell.cell} (cell level)</span>
                  <span className="text-xs text-muted-foreground">Less precise</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {villages.map((v) => {
                    const active = value?.village === v.village && value?.cell === v.cell;
                    return (
                      <button key={v.village} type="button" onClick={() => pickVillage(v)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition ${
                          active ? "border-primary bg-primary/5 text-primary" : "border-input bg-background hover:border-primary/50"
                        }`}>
                        <span>{v.village}</span>
                        {active && <Check className="h-4 w-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Village data is served as a static JSON asset (public/rwanda-villages.json)
// instead of being compiled into a ~2.2 MB JS chunk. The browser fetches it
// once on demand (the first time the SectorPicker needs villages), parses it
// with the fast native JSON parser, and the service worker runtime-caches it
// across sessions. This module is now just the type + cached loader + helpers.

export interface RwandaVillage {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  /** Composite key matching RwandaCell.pcode */
  cellPcode: string;
  lat: number;
  lng: number;
}

const VILLAGES_URL = "/rwanda-villages.json";

// Cache the in-flight/resolved fetch so repeated calls within a session share
// a single network request and a single parsed array.
let villagesPromise: Promise<RwandaVillage[]> | null = null;

function loadVillages(): Promise<RwandaVillage[]> {
  if (!villagesPromise) {
    villagesPromise = fetch(VILLAGES_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load villages: ${res.status}`);
        return res.json() as Promise<RwandaVillage[]>;
      })
      .catch((err) => {
        // Reset so a later call can retry instead of caching the failure.
        villagesPromise = null;
        throw err;
      });
  }
  return villagesPromise;
}

export async function villagesByCellPcode(): Promise<Map<string, RwandaVillage[]>> {
  const villages = await loadVillages();
  const m = new Map<string, RwandaVillage[]>();
  for (const v of villages) {
    if (!m.has(v.cellPcode)) m.set(v.cellPcode, []);
    m.get(v.cellPcode)!.push(v);
  }
  return m;
}

function hav(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the nearest Rwanda village to the given WGS-84 coordinates. */
export async function reverseGeocode(lat: number, lng: number): Promise<RwandaVillage | null> {
  const villages = await loadVillages();
  if (villages.length === 0) return null;
  let best = villages[0];
  let bestDist = hav(lat, lng, best.lat, best.lng);
  for (let i = 1; i < villages.length; i++) {
    const d = hav(lat, lng, villages[i].lat, villages[i].lng);
    if (d < bestDist) {
      bestDist = d;
      best = villages[i];
    }
  }
  return best;
}

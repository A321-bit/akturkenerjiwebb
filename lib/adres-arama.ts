// Adres önerileri: anahtar Places API'ye açıksa Google, değilse Photon (OpenStreetMap).
// Sokak, site ve işletme adları yazıldıkça önerilir; seçilen önerinin koordinatı alınır.

export type AddressHit = { id: string; title: string; subtitle: string; lat?: number; lon?: number; source: "google" | "osm" };

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// Anahtar Places API'ye kapalıysa sayfa boyunca tekrar denenmez.
let googleOff = !KEY;
let sessionToken: string | null = null;

const token = () => (sessionToken ??= crypto.randomUUID());

type GooglePrediction = { placePrediction?: { placeId: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } }; text?: { text?: string } } };

async function fromGoogle(q: string, signal: AbortSignal): Promise<AddressHit[]> {
  const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY! },
    body: JSON.stringify({ input: q, languageCode: "tr", regionCode: "TR", includedRegionCodes: ["tr"], sessionToken: token() }),
    signal,
  });
  if (r.status === 403) googleOff = true;
  if (!r.ok) throw new Error(`Places ${r.status}`);
  const d = (await r.json()) as { suggestions?: GooglePrediction[] };
  return (d.suggestions ?? []).flatMap((s) => {
    const p = s.placePrediction;
    if (!p) return [];
    return [{ id: p.placeId, title: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "", subtitle: p.structuredFormat?.secondaryText?.text ?? "", source: "google" as const }];
  });
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: { osm_id: number; name?: string; street?: string; housenumber?: string; district?: string; locality?: string; city?: string; county?: string; state?: string; countrycode?: string };
};

async function fromPhoton(q: string, signal: AbortSignal): Promise<AddressHit[]> {
  // Ankara yakınlığı öncelikli, Türkiye sınırları içinde.
  const u = new URLSearchParams({ q, limit: "6", bbox: "25.6,35.8,44.9,42.2", lat: "39.93", lon: "32.85" });
  const r = await fetch(`https://photon.komoot.io/api/?${u}`, { signal });
  if (!r.ok) throw new Error(`Photon ${r.status}`);
  const d = (await r.json()) as { features?: PhotonFeature[] };
  return (d.features ?? [])
    .filter((f) => f.properties.countrycode === "TR")
    .map((f) => {
      const p = f.properties;
      const street = [p.street, p.housenumber].filter(Boolean).join(" ");
      const title = p.name ?? street;
      const rest = [p.name && p.name !== street ? street : "", p.district ?? p.locality, p.city ?? p.county, p.state].filter(Boolean);
      return { id: `osm-${p.osm_id}`, title, subtitle: [...new Set(rest)].join(", "), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], source: "osm" as const };
    })
    .filter((h, i, all) => h.title && all.findIndex((o) => o.title === h.title && o.subtitle === h.subtitle) === i);
}

export async function suggestAddresses(q: string, signal: AbortSignal): Promise<AddressHit[]> {
  if (!googleOff) {
    try {
      return await fromGoogle(q, signal);
    } catch (e) {
      if (signal.aborted) throw e;
    }
  }
  return fromPhoton(q, signal);
}

/** Seçilen önerinin koordinatı; Google önerilerinde ayrıca sorgulanır ve oturum burada kapanır. */
export async function resolveAddress(hit: AddressHit): Promise<{ lat: number; lon: number } | null> {
  if (hit.lat != null && hit.lon != null) return { lat: hit.lat, lon: hit.lon };
  const session = sessionToken;
  sessionToken = null;
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(hit.id)}?languageCode=tr${session ? `&sessionToken=${session}` : ""}`, {
    headers: { "X-Goog-Api-Key": KEY!, "X-Goog-FieldMask": "location" },
  });
  if (!r.ok) return null;
  const d = (await r.json()) as { location?: { latitude: number; longitude: number } };
  return d.location ? { lat: d.location.latitude, lon: d.location.longitude } : null;
}

// Google İşletme Profili puanı ve yorumları — Places API (New).
// GOOGLE_PLACES_API_KEY yoksa ya da istek başarısız olursa null döner ve
// yorum bölümleri hiç render edilmez. Günde bir kez yenilenir; ayda ~30
// istek Google'ın ücretsiz kotasının çok altında kalır.

const PLACES_URL = "https://places.googleapis.com/v1/places";
const DAY = 60 * 60 * 24;

// "AKTÜRK ENERJİ TEKNOLOJİLERİ SAN. TİC. LTD. ŞTİ" — Esertepe, Keçiören.
const PLACE_ID = "ChIJpUHWpVhM0xQRLh2n_N-s8Z8";

export type GoogleReview = {
  author: string;
  authorUrl?: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime?: string;
};

export type GoogleReviews = {
  rating: number;
  count: number;
  mapsUrl: string;
  writeReviewUrl: string;
  reviews: GoogleReview[];
};

type PlaceResponse = {
  id: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating: number;
    relativePublishTimeDescription?: string;
    publishTime?: string;
    text?: { text: string };
    originalText?: { text: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }[];
};

export async function getGoogleReviews(): Promise<GoogleReviews | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(`${PLACES_URL}/${PLACE_ID}?languageCode=tr`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "id,rating,userRatingCount,googleMapsUri,reviews",
      },
      next: { revalidate: DAY },
    });
    if (!res.ok) {
      console.error("Google Places isteği başarısız:", res.status, await res.text());
      return null;
    }
    const place = (await res.json()) as PlaceResponse;
    if (!place.rating || !place.userRatingCount) return null;

    return {
      rating: place.rating,
      count: place.userRatingCount,
      mapsUrl: place.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
      writeReviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
      reviews: (place.reviews ?? [])
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "Google kullanıcısı",
          authorUrl: r.authorAttribution?.uri,
          authorPhoto: r.authorAttribution?.photoUri,
          rating: r.rating,
          text: (r.text?.text ?? r.originalText?.text ?? "").trim(),
          relativeTime: r.relativePublishTimeDescription ?? "",
          publishTime: r.publishTime,
        }))
        .filter((r) => r.text.length > 0),
    };
  } catch (err) {
    console.error("Google yorumları alınamadı:", err);
    return null;
  }
}

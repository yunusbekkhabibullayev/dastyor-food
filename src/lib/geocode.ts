// Free reverse geocoding via OpenStreetMap Nominatim (no API key, light usage only).
export async function reverseGeocode(
  lat: number,
  lng: number,
  lang: string,
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${lang}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const j = (await res.json()) as { display_name?: string; address?: Record<string, string> };
    const a = j.address ?? {};
    const parts = [
      a["road"] ?? a["pedestrian"] ?? a["neighbourhood"],
      a["house_number"],
      a["suburb"] ?? a["city_district"],
      a["city"] ?? a["town"] ?? a["village"],
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : (j.display_name ?? null);
  } catch {
    return null;
  }
}

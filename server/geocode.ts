export interface GeocodeResult {
  formattedAddress: string;
  coordinates: { lat: number; lng: number };
}

const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocode an address using Google Maps API with South Africa regional bias.
 * Returns null on any error (never throws).
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address?.trim() || !googleApiKey) return null;

  try {
    const encoded = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${googleApiKey}&region=za`;

    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      console.error(`Geocode HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`Geocode status: ${data.status}, results: ${data.results?.length || 0}, error: ${data.error_message || "none"}`);
    if (data.status !== "OK" || !data.results?.length) return null;

    const result = data.results[0];
    return {
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    };
  } catch {
    return null;
  }
}

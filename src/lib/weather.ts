// Alertes météo réelles pour les rappels d'entretien — OpenWeatherMap
// a un niveau gratuit (60 appels/min, 1M/mois) largement suffisant ici.
// Sans clé configurée, getWeatherSnapshot renvoie simplement null et les
// rappels fonctionnent comme avant, sans ajustement météo.

const OWM_BASE = "https://api.openweathermap.org/data/2.5";

export interface WeatherSnapshot {
  tempC: number | null;
  condition: string;
  humidity: number | null;
  willRainSoon: boolean;
  frostRisk: boolean;
  droughtRisk: boolean;
  heatRisk: boolean;
  advice: string;
}

interface ForecastEntry {
  main?: { temp?: number; temp_min?: number };
  weather?: Array<{ description?: string }>;
  rain?: Record<string, number>;
}

export async function getWeatherSnapshot(
  lat: number,
  lng: number
): Promise<WeatherSnapshot | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `${OWM_BASE}/weather?lat=${lat}&lon=${lng}&units=metric&lang=fr&appid=${apiKey}`,
        { signal: AbortSignal.timeout(8_000) }
      ),
      fetch(
        `${OWM_BASE}/forecast?lat=${lat}&lon=${lng}&units=metric&lang=fr&appid=${apiKey}&cnt=16`,
        { signal: AbortSignal.timeout(8_000) }
      ),
    ]);

    if (!currentRes.ok) return null;
    const current = await currentRes.json();
    const forecast = forecastRes.ok ? await forecastRes.json() : null;

    const tempC: number | null = current.main?.temp ?? null;
    const condition: string = current.weather?.[0]?.description ?? "";
    const humidity: number | null = current.main?.humidity ?? null;

    const next48h: ForecastEntry[] = forecast?.list?.slice(0, 16) ?? [];
    const willRainSoon = next48h.some(
      (entry) =>
        (entry.rain?.["3h"] ?? 0) > 0 ||
        /pluie|averse|orage/i.test(entry.weather?.[0]?.description || "")
    );
    const minTempNext48h = next48h.length
      ? Math.min(...next48h.map((e) => e.main?.temp_min ?? e.main?.temp ?? 99))
      : (tempC ?? 99);

    const frostRisk = (tempC !== null && tempC <= 2) || minTempNext48h <= 2;
    const heatRisk = tempC !== null && tempC >= 38;
    const droughtRisk = !willRainSoon && humidity !== null && humidity < 30;

    let advice = "";
    if (frostRisk) {
      advice = "Risque de gel : protégez les plantes sensibles, rentrez les pots si possible.";
    } else if (heatRisk) {
      advice = "Forte chaleur prévue : arrosez tôt le matin ou en soirée pour limiter l'évaporation.";
    } else if (willRainSoon) {
      advice = "Pluie prévue dans les prochaines 48h : vous pouvez sauter l'arrosage prévu.";
    } else if (droughtRisk) {
      advice = "Air sec et aucune pluie prévue : surveillez l'humidité du sol de près.";
    }

    return { tempC, condition, humidity, willRainSoon, frostRisk, droughtRisk, heatRisk, advice };
  } catch (error) {
    console.error("Erreur météo:", error);
    return null;
  }
}

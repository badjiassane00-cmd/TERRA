import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

interface PlantWithSpecialty {
  id: string;
  scientificName: string;
  commonNames: string | null;
  family: string | null;
  description: string | null;
  imageUrl: string | null;
  medicinal: boolean | null;
  watering: string | null;
  sunlight: string | null;
  soil: string | null;
  bloomingMonths: string | null;
  diseases: Array<{
    disease: {
      name: string;
      treatment: string | null;
    };
    confidence: number | null;
  }>;
  computedSpecialty: string;
}
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const specialty = searchParams.get("specialty");
    const season = searchParams.get("season");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");

    const specialtyKeywords: Record<string, string[]> = {
      "Médicinale": ["médicinal", "thérapeutique", "pharmaceutique", "remède", "guérison", "antioxydant", "anti-inflammatoire"],
      "Ornementale": ["ornemental", "décoratif", "parc", "jardin", "spectaculaire", "fleurs"],
      "Forestière": ["bois", "ébénisterie", "menuiserie", "forêt", "forestier"],
      "Alimentaire": ["alimentaire", "nutrition", "fruit", "comestible", "cuisine"],
      "Savane": ["savane", "semi-aride", "résistant"],
      "Montagnarde": ["montagne", "altitude", "froid"],
      "Désertique": ["désert", "aride", "succulente"],
      "Tropicale": ["tropical", "humide", "forêt dense"],
      "Méditerranéenne": ["méditerranéen", "sec", "chaleur"],
    };

    const specialtyKeys = Object.keys(specialtyKeywords);

    const allPlants = await prisma.plant.findMany({
      include: {
        diseases: {
          include: {
            disease: true,
          },
        },
      },
    });

    const plantsWithSpecialty = allPlants.map((plant) => {
      const description = (plant.description || "").toLowerCase();
      const bestMatch = specialtyKeys.find((key) => {
        const keywords = specialtyKeywords[key];
        return keywords.some((kw) => description.includes(kw.toLowerCase()));
      });

      return {
        ...plant,
        computedSpecialty: bestMatch || "Autre",
      };
    });

    let filteredPlants = plantsWithSpecialty;

    if (region) {
      filteredPlants = filteredPlants.filter((p) =>
        (p.description || "").toLowerCase().includes(region.toLowerCase())
      );
    }

    if (specialty && specialty !== "all") {
      filteredPlants = filteredPlants.filter((p) => p.computedSpecialty === specialty);
    }

    if (season && season !== "all") {
      filteredPlants = filteredPlants.filter((p) => {
        const blooming = p.bloomingMonths;
        if (!blooming) return false;
        const months = typeof blooming === "string" ? JSON.parse(blooming) : blooming;
        return Array.isArray(months) && months.includes(season);
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filteredPlants = filteredPlants.filter((p) =>
        (p.scientificName || "").toLowerCase().includes(q) ||
        (p.commonNames || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }

    const plants = filteredPlants.slice(0, limit).map((plant: PlantWithSpecialty) => ({
      id: plant.id,
      name: plant.commonNames ? JSON.parse(plant.commonNames)[0] : plant.scientificName,
      scientificName: plant.scientificName,
      family: plant.family,
      description: plant.description,
      region: plant.description ? extractRegionFromDescription(plant.description) : "Autre",
      specialty: plant.computedSpecialty,
      imageUrl: plant.imageUrl,
      medicinal: plant.medicinal,
      care: {
        watering: plant.watering,
        sunlight: plant.sunlight,
        soil: plant.soil,
      },
      diseases: (plant.diseases || []).map((pd) => ({
        name: pd.disease.name,
        confidence: pd.confidence,
        treatment: pd.disease.treatment,
      })),
    }));

    const regions: Array<{ id: string; name: string; countries: string[]; plantCount: number; specialties: string[]; bloomingNow: string[] }> = [
      { id: "west-africa", name: "Afrique de l'Ouest", countries: ["Sénégal", "Mali", "Burkina Faso", "Côte d'Ivoire", "Ghana"], plantCount: 0, specialties: [], bloomingNow: [] },
      { id: "central-africa", name: "Afrique Centrale", countries: ["Cameroun", "Gabon", "Congo", "RDC"], plantCount: 0, specialties: [], bloomingNow: [] },
      { id: "east-africa", name: "Afrique de l'Est", countries: ["Kenya", "Tanzanie", "Ouganda", "Éthiopie"], plantCount: 0, specialties: [], bloomingNow: [] },
      { id: "north-africa", name: "Afrique du Nord", countries: ["Maroc", "Algérie", "Tunisie", "Égypte"], plantCount: 0, specialties: [], bloomingNow: [] },
    ];

    const regionMap: Record<string, string> = {
      "Afrique de l'Ouest": "west-africa",
      "Afrique Centrale": "central-africa",
      "Afrique de l'Est": "east-africa",
      "Afrique du Nord": "north-africa",
      "ouest": "west-africa",
      "centrale": "central-africa",
      "est": "east-africa",
      "nord": "north-africa",
    };

    for (const plant of plants) {
      const regionKey = regionMap[plant.region || ""] || null;
      if (regionKey) {
        const regionData = regions.find((r) => r.id === regionKey);
        if (regionData) {
          regionData.plantCount++;
          const specialtyName = plant.specialty || "Autre";
          if (!regionData.specialties.includes(specialtyName)) {
            regionData.specialties.push(specialtyName);
          }
        }
      }
    }

    const specialtyCounts: Record<string, number> = {};
    for (const plant of plants) {
      specialtyCounts[plant.specialty] = (specialtyCounts[plant.specialty] || 0) + 1;
    }

    const specialtiesList = specialtyKeys.map((name) => ({
      id: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      name,
      count: specialtyCounts[name] || 0,
      description: `Plantes ${name.toLowerCase()}s d'Afrique`,
    }));

    return NextResponse.json({
      plants,
      regions,
      specialties: specialtiesList,
      stats: {
        totalPlants: plants.length,
        totalSpecies: new Set(plants.map((p) => p.scientificName)).size,
        totalRegions: regions.filter((r) => r.plantCount > 0).length,
        totalSpecialties: specialtiesList.filter((s) => s.count > 0).length,
      },
    });
  } catch (error) {
    console.error("Erreur données exposition:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}



export const GET = withApiErrors(GETImpl);

function extractRegionFromDescription(description?: string): string {
  if (!description) return "Autre";
  const regionKeywords: Record<string, string[]> = {
    "Afrique de l'Ouest": ["ouest", "sénégal", "mali", "burkina", "côte d'ivoire", "ghana", "niger", "tchad", "sahel"],
    "Afrique Centrale": ["centrale", "cameroun", "gabon", "congo", "rdc", "guinée équatoriale", "tropicale"],
    "Afrique de l'Est": ["est", "kenya", "tanzanie", "ouganda", "éthiopie", "soudan", "savane", "montagne"],
    "Afrique du Nord": ["nord", "maroc", "algérie", "tunisie", "égypte", "méditerranéen", "désert"],
  };

  const lower = description.toLowerCase();
  for (const [region, keywords] of Object.entries(regionKeywords)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return region;
    }
  }
  return "Autre";
}

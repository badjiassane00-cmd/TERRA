import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Génère un quiz de reconnaissance botanique à partir des plantes déjà
// enrichies en base (famille/genre issus de GBIF). Question type
// "famille" : la plus utile pour un cours de botanique, où reconnaître
// une famille à des caractères morphologiques communs est l'objectif
// pédagogique central — plus formateur que deviner un nom scientifique
// entier au hasard.

interface QuizQuestion {
  id: string;
  scientificName: string;
  commonName: string | null;
  imageUrl: string | null;
  question: string;
  options: string[];
  correctAnswer: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = Math.min(parseInt(searchParams.get("count") || "5"), 15);

    const plants = await prisma.plant.findMany({
      where: { family: { not: null } },
      select: { id: true, scientificName: true, commonNames: true, family: true, imageUrl: true },
    });

    const families = Array.from(new Set(plants.map((p) => p.family).filter(Boolean))) as string[];

    if (plants.length < 4 || families.length < 4) {
      return NextResponse.json({
        questions: [],
        error:
          "Pas encore assez de plantes documentées (avec famille connue) pour générer un quiz. Identifiez ou ajoutez plus d'espèces d'abord.",
      });
    }

    const pool = shuffle(plants).slice(0, count);

    const questions: QuizQuestion[] = pool.map((plant) => {
      const correctFamily = plant.family!;
      const distractors = shuffle(families.filter((f) => f !== correctFamily)).slice(0, 3);
      const options = shuffle([correctFamily, ...distractors]);
      let commonName: string | null = null;
      try {
        const parsed = JSON.parse(plant.commonNames || "[]");
        commonName = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      } catch {
        commonName = null;
      }

      return {
        id: plant.id,
        scientificName: plant.scientificName,
        commonName,
        imageUrl: plant.imageUrl,
        question: `À quelle famille appartient ${plant.scientificName} ?`,
        options,
        correctAnswer: correctFamily,
      };
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Erreur /api/quiz:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

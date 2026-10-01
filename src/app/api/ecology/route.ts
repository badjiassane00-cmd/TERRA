import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityRepository } from "@/server/observations/community.repository";

/** Phenology and co-presence signals derived only from public community observations. */
async function GETImpl(request: Request) {
  const region = new URL(request.url).searchParams.get("region")?.trim();
  try {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 2);
    const posts = await communityRepository.findForEcology(since, region || undefined);

    const months = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, count: 0, species: new Set<string>(), groups: new Set<string>() }));
    for (const post of posts) {
      if (!post.observedAt) continue;
      const bucket = months[post.observedAt.getMonth()];
      bucket.count += 1;
      bucket.species.add(post.scientificName || post.plantName);
      bucket.groups.add(post.organismGroup);
    }

    // Co-presence is deliberately limited to public GPS observations in the same
    // 5 km cell and calendar month. It is not evidence of pollination.
    const located = posts.filter((post) => post.latitude !== null && post.longitude !== null && post.observedAt);
    const cell = (lat: number, lng: number) => `${Math.round(lat / 0.045)}:${Math.round(lng / 0.045)}`;
    const bins = new Map<string, { plants: Set<string>; insects: Set<string> }>();
    for (const post of located) {
      if (!post.observedAt) continue;
      const key = `${cell(post.latitude!, post.longitude!)}:${post.observedAt.getFullYear()}-${post.observedAt.getMonth()}`;
      const bin = bins.get(key) || { plants: new Set<string>(), insects: new Set<string>() };
      if (post.organismGroup === "PLANT") bin.plants.add(post.scientificName || post.plantName);
      if (post.organismGroup === "INSECT") bin.insects.add(post.scientificName || post.plantName);
      bins.set(key, bin);
    }
    const relations = new Map<string, { plant: string; insect: string; occurrences: number }>();
    for (const bin of bins.values()) {
      for (const plant of bin.plants) for (const insect of bin.insects) {
        const key = `${plant}\u0000${insect}`;
        const relation = relations.get(key) || { plant, insect, occurrences: 0 };
        relation.occurrences += 1;
        relations.set(key, relation);
      }
    }

    const currentMonth = new Date().getMonth() + 1;
    const current = months[currentMonth - 1];
    const next = months[currentMonth % 12];
    return NextResponse.json({
      calendar: months.map((month) => ({ month: month.month, count: month.count, speciesCount: month.species.size, groups: [...month.groups] })),
      currentMonth: { month: currentMonth, count: current.count, species: [...current.species].slice(0, 8) },
      nextMonth: { month: (currentMonth % 12) + 1, count: next.count, species: [...next.species].slice(0, 8) },
      relations: [...relations.values()].filter((relation) => relation.occurrences >= 2).sort((a, b) => b.occurrences - a.occurrences).slice(0, 12),
      region: region || "Monde",
      sourceCount: posts.length,
    });
  } catch (error) {
    console.error("Erreur calendrier écologique:", error);
    return NextResponse.json({ error: "Les observations écologiques sont indisponibles." }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);

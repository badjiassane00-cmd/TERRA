export interface ExhibitionSummary {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  isPublic: boolean;
  coverImage: string | null;
  _count: { items: number };
  user?: { name: string };
}

export interface ExhibitionItem {
  id: string;
  note: string | null;
  imageUrl: string | null;
  plant: {
    id: string;
    scientificName: string;
    commonNames: string;
    family: string | null;
    imageUrl: string | null;
  };
}

export interface ExhibitionDetail extends ExhibitionSummary {
  items: ExhibitionItem[];
}


export function parseCommonNames(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

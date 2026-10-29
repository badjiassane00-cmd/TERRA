const CATEGORY_LABELS: Record<string, { label: string; severity: number }> = {
  EX: { label: "Éteinte", severity: 5 },
  EW: { label: "Éteinte à l'état sauvage", severity: 5 },
  CR: { label: "En danger critique", severity: 4 },
  EN: { label: "En danger", severity: 3 },
  VU: { label: "Vulnérable", severity: 2 },
  NT: { label: "Quasi menacée", severity: 1 },
  LC: { label: "Préoccupation mineure", severity: 0 },
  DD: { label: "Données insuffisantes", severity: -1 },
  NE: { label: "Non évaluée", severity: -1 },
  NA: { label: "Non applicable", severity: -1 },
};

type IucnAssessment = {
  latest?: boolean;
  red_list_category_code?: unknown;
  category?: unknown;
  assessment_date?: string;
  year_published?: string | number;
  assessment_id?: number;
  url?: string;
  scopes?: Array<{ code?: string; description?: { en?: string } | string }>;
};

export type NormalizedIucnCategory = {
  code: string;
  label: string;
  severity: number;
};

export function buildIucnTaxonSearchUrl(scientificName: string) {
  const [genusName, speciesName, ...infraName] = scientificName.trim().split(/\s+/);
  if (!genusName || !speciesName) return null;
  const url = new URL("https://api.iucnredlist.org/api/v4/taxa/scientific_name");
  url.searchParams.set("genus_name", genusName);
  url.searchParams.set("species_name", speciesName);
  if (infraName.length) url.searchParams.set("infra_name", infraName.join(" "));
  return url;
}

export function normalizeIucnCategory(value: unknown): NormalizedIucnCategory | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const code = value.trim();
  const normalized = code.toUpperCase();
  const legacyLowerRisk = normalized.match(/^LR\s*\/\s*(LC|NT|CD)$/);
  if (legacyLowerRisk?.[1] === "CD") {
    return { code, label: "Moindre risque · dépendante de mesures de conservation", severity: 0 };
  }
  const categoryCode = legacyLowerRisk?.[1] || normalized;
  const category = CATEGORY_LABELS[categoryCode];
  return category ? { code, ...category } : { code, label: code, severity: -1 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getAssessmentList(value: unknown): IucnAssessment[] {
  if (Array.isArray(value)) return value.filter(isRecord) as IucnAssessment[];
  if (!isRecord(value)) return [];
  const taxon = isRecord(value.taxon) ? value.taxon : null;
  const assessments = taxon?.assessments ?? value.assessments;
  return Array.isArray(assessments) ? assessments.filter(isRecord) as IucnAssessment[] : [];
}

function isGlobalAssessment(assessment: IucnAssessment) {
  return assessment.scopes?.some((scope) => scope.code === "1" || (typeof scope.description === "object" && scope.description?.en?.toLowerCase() === "global")) || false;
}

export function selectIucnAssessment(value: unknown) {
  const assessments = getAssessmentList(value);
  const selected = assessments.find((assessment) => assessment.latest && isGlobalAssessment(assessment))
    || assessments.find((assessment) => assessment.latest)
    || assessments.find(isGlobalAssessment)
    || assessments[0];
  if (!selected) return null;
  const category = normalizeIucnCategory(selected.red_list_category_code ?? selected.category);
  if (!category) return null;
  const global = isGlobalAssessment(selected);
  const scopeLabel = selected.scopes?.find((scope) => scope.code === "1")?.description;
  const scope = global ? "Global" : typeof scopeLabel === "object" ? scopeLabel?.en || null : scopeLabel || null;
  return {
    ...category,
    assessmentDate: selected.assessment_date || null,
    yearPublished: selected.year_published == null ? null : String(selected.year_published),
    assessmentId: selected.assessment_id || null,
    scope,
    url: selected.url?.startsWith("https://") ? selected.url : null,
  };
}

export const ORGANISM_GROUPS = [
  "PLANT",
  "INSECT",
  "BIRD",
  "MAMMAL",
  "REPTILE",
  "AMPHIBIAN",
  "FUNGUS",
  "AQUATIC",
  "OTHER",
] as const;

export type OrganismGroup = (typeof ORGANISM_GROUPS)[number];
export type OrganismFilter = OrganismGroup | "ALL";

export const ORGANISM_LABELS: Record<OrganismGroup, string> = {
  PLANT: "Plante",
  INSECT: "Insecte",
  BIRD: "Oiseau",
  MAMMAL: "Mammifère",
  REPTILE: "Reptile",
  AMPHIBIAN: "Amphibien",
  FUNGUS: "Champignon",
  AQUATIC: "Vie aquatique",
  OTHER: "Autre vivant",
};

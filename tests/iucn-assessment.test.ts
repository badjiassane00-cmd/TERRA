import assert from "node:assert/strict";
import test from "node:test";
import { buildIucnTaxonSearchUrl, normalizeIucnCategory, selectIucnAssessment } from "../src/lib/iucn-assessment";

test("construit la recherche UICN v4 avec les paramètres taxonomiques attendus", () => {
  const url = buildIucnTaxonSearchUrl("Panthera leo persica");
  assert.equal(url?.pathname, "/api/v4/taxa/scientific_name");
  assert.equal(url?.searchParams.get("genus_name"), "Panthera");
  assert.equal(url?.searchParams.get("species_name"), "leo");
  assert.equal(url?.searchParams.get("infra_name"), "persica");
  assert.equal(buildIucnTaxonSearchUrl("Panthera"), null);
});

test("normalise les catégories actuelles et historiques sans confondre les codes", () => {
  assert.deepEqual(normalizeIucnCategory("LR/lc"), { code: "LR/lc", label: "Préoccupation mineure", severity: 0 });
  assert.deepEqual(normalizeIucnCategory("LR/nt"), { code: "LR/nt", label: "Quasi menacée", severity: 1 });
  assert.deepEqual(normalizeIucnCategory("LR/cd"), { code: "LR/cd", label: "Moindre risque · dépendante de mesures de conservation", severity: 0 });
  assert.equal(normalizeIucnCategory("VU")?.label, "Vulnérable");
  assert.equal(normalizeIucnCategory({ code: "EN" }), null);
});

test("choisit l’évaluation globale la plus récente et conserve sa provenance", () => {
  const result = selectIucnAssessment({ taxon: { assessments: [
    { latest: true, red_list_category_code: "VU", assessment_id: 11, scopes: [{ code: "4", description: { en: "Mediterranean" } }] },
    { latest: true, red_list_category_code: "EN", assessment_id: 12, assessment_date: "2025-01-01", year_published: 2025, url: "https://www.iucnredlist.org/species/1/2", scopes: [{ code: "1", description: { en: "Global" } }] },
    { latest: false, red_list_category_code: "LR/lc", assessment_id: 13, scopes: [{ code: "1", description: { en: "Global" } }] },
  ] } });
  assert.equal(result?.code, "EN");
  assert.equal(result?.scope, "Global");
  assert.equal(result?.assessmentId, 12);
  assert.equal(result?.yearPublished, "2025");
});

test("retourne null pour une réponse sans évaluation exploitable", () => {
  assert.equal(selectIucnAssessment({ assessments: [] }), null);
  assert.equal(selectIucnAssessment({ assessments: [{ latest: true }] }), null);
  assert.equal(selectIucnAssessment(null), null);
});

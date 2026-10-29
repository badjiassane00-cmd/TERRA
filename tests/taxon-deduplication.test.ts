import assert from "node:assert/strict";
import test from "node:test";
import { deduplicateTaxonUsages } from "../src/server/species/taxon-deduplication";

test("garde une seule première occurrence par taxon canonique GBIF", () => {
  const rows = [
    { key: 1, nubKey: 10, name: "accepted" },
    { key: 2, nubKey: 10, name: "synonym" },
    { key: 3, nubKey: 30, name: "other" },
    { key: 4, name: "without backbone key" },
  ];
  assert.deepEqual(deduplicateTaxonUsages(rows), [rows[0], rows[2], rows[3]]);
});

test("supporte nubKey nul et identifiants distincts", () => {
  assert.deepEqual(deduplicateTaxonUsages([{ key: 1, nubKey: null }, { key: 2, nubKey: null }]), [{ key: 1, nubKey: null }, { key: 2, nubKey: null }]);
});

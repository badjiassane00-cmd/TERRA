import assert from "node:assert/strict";
import test from "node:test";
import { acceptedIdentificationImageTypes, MAX_IDENTIFICATION_IMAGE_BYTES, validateIdentificationImage } from "../src/lib/identification-image";

test("formats acceptés selon le parcours", () => {
  assert.deepEqual(acceptedIdentificationImageTypes("plants"), ["image/jpeg", "image/png"]);
  assert.ok(acceptedIdentificationImageTypes("life").includes("image/webp"));
  assert.ok(acceptedIdentificationImageTypes("disease").includes("image/webp"));
});

test("la taille maximale est inclusive et rejette le dépassement", () => {
  assert.equal(validateIdentificationImage({ type: "image/jpeg", size: MAX_IDENTIFICATION_IMAGE_BYTES }, "plants"), null);
  assert.equal(validateIdentificationImage({ type: "image/jpeg", size: MAX_IDENTIFICATION_IMAGE_BYTES + 1 }, "plants")?.status, 413);
});

test("rejette les fichiers vides et les types non autorisés", () => {
  assert.equal(validateIdentificationImage({ type: "image/jpeg", size: 0 }, "plants")?.status, 400);
  assert.equal(validateIdentificationImage({ type: "image/webp", size: 100 }, "plants")?.status, 415);
  assert.equal(validateIdentificationImage({ type: "image/webp", size: 100 }, "life"), null);
});

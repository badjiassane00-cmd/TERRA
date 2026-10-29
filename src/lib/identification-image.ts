export type IdentificationImageMode = "plants" | "life" | "disease";
export type IdentificationImageType = "image/jpeg" | "image/png" | "image/webp";
export type IdentificationImageFile = Pick<File, "type" | "size">;

export const MAX_IDENTIFICATION_IMAGE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES: Record<IdentificationImageMode, readonly IdentificationImageType[]> = {
  plants: ["image/jpeg", "image/png"],
  life: ["image/jpeg", "image/png", "image/webp"],
  disease: ["image/jpeg", "image/png", "image/webp"],
};

const FORMAT_LABELS: Record<IdentificationImageType, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

export function acceptedIdentificationImageTypes(mode: IdentificationImageMode): readonly IdentificationImageType[] {
  return ACCEPTED_IMAGE_TYPES[mode];
}

export function validateIdentificationImage(file: IdentificationImageFile, mode: IdentificationImageMode) {
  if (!file.size) return { status: 400, message: "Le fichier image est vide." } as const;
  if (file.size > MAX_IDENTIFICATION_IMAGE_BYTES) {
    return { status: 413, message: "L’image ne doit pas dépasser 10 Mo." } as const;
  }
  const acceptedTypes = ACCEPTED_IMAGE_TYPES[mode];
  if (!acceptedTypes.includes(file.type as IdentificationImageType)) {
    const formats = acceptedTypes.map((type) => FORMAT_LABELS[type]).join(", ");
    return { status: 415, message: `Utilisez une image ${formats}.` } as const;
  }
  return null;
}

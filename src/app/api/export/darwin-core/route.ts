import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireModerator } from "../../../../lib/moderation";
import { getSessionUserId } from "../../../../lib/session";

// Export au format Darwin Core (standard international pour les
// données d'occurrence d'espèces — https://dwc.tdwg.org/terms/),
// consommable directement par GBIF ou tout logiciel de recherche
// (R/Python, QGIS...). Deux portées :
//  - scope=mine (défaut) : les propres observations de l'utilisateur
//  - scope=all : toutes les observations, réservé aux comptes
//    Institution/Admin (vérifié côté serveur, jamais sur la base du
//    rôle envoyé par le client)
const DWC_HEADERS = [
  "occurrenceID",
  "basisOfRecord",
  "scientificName",
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "decimalLatitude",
  "decimalLongitude",
  "eventDate",
  "recordedBy",
  "occurrenceRemarks",
];

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") === "all" ? "all" : "mine";

    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    if (scope === "all") {
      const moderator = await requireModerator(sessionUserId);
      if (!moderator) {
        return NextResponse.json(
          { error: "L'export complet est réservé aux comptes institution." },
          { status: 403 }
        );
      }
    }

    const scans = await prisma.scanHistory.findMany({
      where: scope === "mine" ? { userId: sessionUserId } : undefined,
      include: {
        plant: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000, // garde-fou raisonnable pour un export en un seul fichier
    });

    const rows = scans
      .filter((scan) => scan.plant)
      .map((scan) => {
        const p = scan.plant!;
        return DWC_HEADERS.map((header) => {
          switch (header) {
            case "occurrenceID":
              return csvEscape(scan.id);
            case "basisOfRecord":
              return "HumanObservation";
            case "scientificName":
              return csvEscape(p.scientificName);
            case "kingdom":
              return csvEscape(p.kingdom);
            case "phylum":
              return csvEscape(p.phylum);
            case "class":
              return csvEscape(p.taxClass);
            case "order":
              return csvEscape(p.order);
            case "family":
              return csvEscape(p.family);
            case "genus":
              return csvEscape(p.genus);
            case "decimalLatitude":
              return csvEscape(scan.lat);
            case "decimalLongitude":
              return csvEscape(scan.lng);
            case "eventDate":
              return csvEscape(scan.createdAt.toISOString().split("T")[0]);
            case "recordedBy":
              return csvEscape(scan.user?.name);
            case "occurrenceRemarks":
              return csvEscape("Collecté via TERRA (identification assistée par IA, à vérifier)");
            default:
              return "";
          }
        }).join(",");
      });

    const csv = [DWC_HEADERS.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sununature-darwin-core-${scope}.csv"`,
      },
    });
  } catch (error) {
    console.error("Erreur /api/export/darwin-core:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);

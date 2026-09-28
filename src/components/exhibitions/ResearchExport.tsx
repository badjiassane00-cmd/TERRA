"use client";

import { Download, FlaskConical } from "lucide-react";

interface ResearchExportProps {
  userId: string;
  userRole?: "user" | "admin" | "institution";
}

export default function ResearchExport({ userRole }: ResearchExportProps) {
  const isModerator = userRole === "institution" || userRole === "admin";

  const download = (scope: "mine" | "all") => {
    const url = `/api/export/darwin-core?scope=${scope}`;
    window.open(url, "_blank");
  };

  return (
    <div className="botanical-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl font-bold text-foreground">Export pour la recherche</h3>
      </div>
      <p className="text-sm text-foreground/60 mb-4">
        Téléchargez vos observations au format{" "}
        <a
          href="https://dwc.tdwg.org/terms/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          Darwin Core
        </a>{" "}
        (CSV), directement exploitable dans R, Python, QGIS ou pour un dépôt sur GBIF.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => download("mine")}
          className="flex items-center gap-2 text-sm px-4 py-2 border border-primary/30 text-primary rounded-full hover:bg-primary/5 transition-colors"
        >
          <Download className="w-4 h-4" />
          Mes observations
        </button>
        {isModerator && (
          <button
            onClick={() => download("all")}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Toutes les observations (institution)
          </button>
        )}
      </div>
    </div>
  );
}

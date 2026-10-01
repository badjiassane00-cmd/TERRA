"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Leaf, Lock, Loader2 } from "lucide-react";
import BackLink from "@/components/navigation/BackLink";

interface ExhibitionItem {
  id: string;
  note: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  plant: {
    scientificName: string;
    commonNames: string;
    family: string | null;
    medicinal: boolean;
  };
}

interface ExhibitionDetail {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  isPublic: boolean;
  user?: { name: string };
  items: ExhibitionItem[];
}

function parseCommonNames(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PublicExhibitionPage() {
  const params = useParams();
  const id = params?.id as string;
  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/my-exhibitions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.exhibition) {
          setNotFound(true);
        } else {
          setExhibition(data.exhibition);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <BackLink href="/" label="Retour à l’accueil" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-primary" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-foreground/50">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement de l&apos;exposition...
          </div>
        )}

        {!isLoading && (notFound || !exhibition) && (
          <div className="text-center py-20">
            <p className="text-lg text-foreground/70">Cette exposition n&apos;existe pas ou plus.</p>
          </div>
        )}

        {!isLoading && exhibition && !exhibition.isPublic && (
          <div className="text-center py-20">
            <Lock className="w-8 h-8 text-foreground/30 mx-auto mb-3" />
            <p className="text-lg text-foreground/70">Cette exposition est privée.</p>
          </div>
        )}

        {!isLoading && exhibition && exhibition.isPublic && (
          <>
            <div className="mb-10">
              {exhibition.theme && (
                <p className="text-xs uppercase tracking-wide text-primary mb-2">{exhibition.theme}</p>
              )}
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
                {exhibition.title}
              </h1>
              {exhibition.description && (
                <p className="text-foreground/70 mb-2">{exhibition.description}</p>
              )}
              {exhibition.user?.name && (
                <p className="text-sm text-foreground/50">Composée par {exhibition.user.name}</p>
              )}
            </div>

            {exhibition.items.length === 0 ? (
              <p className="text-foreground/60">Cette exposition ne contient pas encore de plante.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exhibition.items.map((item) => {
                  const commonNames = parseCommonNames(item.plant.commonNames);
                  return (
                    <div key={item.id} className="border border-border rounded-lg p-4">
                      {item.videoUrl ? <video src={item.videoUrl} poster={item.imageUrl || undefined} controls playsInline className="public-exhibition-media" /> : item.imageUrl && <img src={item.imageUrl} alt={commonNames[0] || item.plant.scientificName} className="public-exhibition-media" />}
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="w-4 h-4 text-primary" />
                        <p className="font-medium text-foreground">
                          {commonNames[0] || item.plant.scientificName}
                        </p>
                      </div>
                      <p className="text-sm text-foreground/60 italic mb-1">{item.plant.scientificName}</p>
                      {item.plant.family && (
                        <p className="text-xs text-foreground/50">Famille : {item.plant.family}</p>
                      )}
                      {item.plant.medicinal && (
                        <p className="text-xs text-primary mt-1">Usage médicinal reconnu</p>
                      )}
                      {item.note && (
                        <p className="text-sm text-foreground/70 mt-2 border-t border-border pt-2">{item.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

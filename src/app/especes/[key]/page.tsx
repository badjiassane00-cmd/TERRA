import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, Globe2, Leaf, MapPin, ShieldCheck } from "lucide-react";
import { gbifSpeciesService } from "@/server/species/gbif.service";

type PageProps = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { key } = await params;
  if (!/^\d{1,12}$/.test(key)) return { title: "Espèce — TERRA" };
  try {
    const species = await gbifSpeciesService.get(Number(key));
    return {
      title: `${species.canonicalName} — Encyclopédie TERRA`,
      description: `Fiche taxonomique de ${species.canonicalName}, avec noms vernaculaires, classification, distribution, statut et sources consultables dans GBIF.`,
    };
  } catch {
    return { title: "Fiche d’espèce — TERRA" };
  }
}

function statusLabel(value: string | null) {
  if (!value) return "Non renseigné";
  const labels: Record<string, string> = {
    LEAST_CONCERN: "Préoccupation mineure", LC: "Préoccupation mineure", NEAR_THREATENED: "Quasi menacée", NT: "Quasi menacée",
    VULNERABLE: "Vulnérable", VU: "Vulnérable", ENDANGERED: "En danger", EN: "En danger", CRITICALLY_ENDANGERED: "En danger critique", CR: "En danger critique",
    DATA_DEFICIENT: "Données insuffisantes", DD: "Données insuffisantes", EXTINCT: "Éteinte", EX: "Éteinte", EXTINCT_IN_THE_WILD: "Éteinte à l’état sauvage", EW: "Éteinte à l’état sauvage",
  };
  return labels[value.toUpperCase()] || value.replaceAll("_", " ").toLowerCase();
}

export default async function SpeciesPage({ params }: PageProps) {
  const { key } = await params;
  if (!/^\d{1,12}$/.test(key)) return <SpeciesUnavailable />;
  let species: Awaited<ReturnType<typeof gbifSpeciesService.get>>;
  try {
    species = await gbifSpeciesService.get(Number(key));
  } catch {
    return <SpeciesUnavailable />;
  }

  const classification = Object.entries({
    Règne: species.classification.kingdom,
    Embranchement: species.classification.phylum,
    Classe: species.classification.class,
    Ordre: species.classification.order,
    Famille: species.classification.family,
    Genre: species.classification.genus,
    Espèce: species.classification.species,
  }).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const leadImage = species.images[0];

  return <main className="species-detail-page">
    <nav className="species-detail-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">/</span><Link href="/biodiversite">Encyclopédie</Link><span aria-hidden="true">/</span><span aria-current="page"><i>{species.canonicalName}</i></span></nav>
    <section className="species-detail-hero">
      <div className="species-detail-copy">
        <span className="species-eyebrow"><Leaf size={14} /> FICHE TAXONOMIQUE · GBIF {species.key}</span>
        <span className="species-detail-rank">{species.rank || "Taxon"} {species.taxonomicStatus && <><span>·</span><ShieldCheck size={13} /> {species.taxonomicStatus}</>}</span>
        <h1><i>{species.canonicalName}</i></h1>
        {species.authorship && <p className="species-detail-authority">{species.authorship}</p>}
        {species.redirectedFromSynonym && <p className="species-synonym-note">Vous avez recherché un synonyme ; cette fiche présente le taxon accepté par le backbone GBIF.</p>}
        <div className="species-detail-names"><strong>Noms vernaculaires</strong>{species.commonNames.length ? <div>{species.commonNames.slice(0, 12).map((name, index) => <span key={`${name.name}-${name.language}-${index}`} title={name.source ? `Source : ${name.source}` : "Source : GBIF"}>{name.name}{name.language && <small>{name.language.toUpperCase()}</small>}</span>)}</div> : <p>Aucun nom vernaculaire associé dans cette source.</p>}</div>
        <a className="species-source-primary" href={`https://www.gbif.org/species/${species.key}`} target="_blank" rel="noreferrer">Ouvrir la fiche GBIF <ArrowUpRight size={15} /></a>
      </div>
      <div className="species-detail-visual">
        {leadImage ? <>
          <Image src={leadImage.url} alt={leadImage.title || `Photographie documentée de ${species.canonicalName}`} fill unoptimized sizes="(max-width: 800px) 100vw, 48vw" priority />
          <div className="species-image-caption"><strong>{leadImage.creator || "Auteur non renseigné"}</strong>{leadImage.publisher && <span>Diffuseur : {leadImage.publisher}</span>}<span>{leadImage.license}</span><a href={leadImage.sourceUrl || leadImage.url} target="_blank" rel="noreferrer">Source originale <ArrowUpRight size={12} /></a><a href={leadImage.licenseUrl} target="_blank" rel="noreferrer">Conditions de licence</a></div>
        </> : <div className="species-no-image"><Leaf size={36} /><strong>Aucune image avec licence vérifiable</strong><span>TERRA n’affiche pas d’image générique comme si elle représentait cette espèce.</span></div>}
      </div>
    </section>

    <div className="species-detail-content">
      <aside className="species-detail-aside">
        <section className="species-fact-card"><span><Globe2 size={15} /> CONSERVATION</span><strong>{statusLabel(species.conservation?.category || null)}</strong>{species.conservation && <a href={species.conservation.sourceUrl} target="_blank" rel="noreferrer">Consulter la recherche UICN <ArrowUpRight size={12} /></a>}<small>Statut indiqué par la source associée dans GBIF. L’absence de statut ne signifie pas que l’espèce n’est pas menacée.</small></section>
        <section className="species-fact-card"><span><MapPin size={15} /> MILIEU ET RÉPARTITION</span><strong>{species.habitat || "Habitat non renseigné"}</strong>{species.distributions.length ? <><div className="species-country-list">{species.distributions.slice(0, 12).map((place, index) => <span key={`${place.country}-${place.locality}-${index}`} title={place.source ? `Source : ${place.source}` : "Source : GBIF"}>{place.locality || place.country}{place.establishmentMeans ? <small>{place.establishmentMeans.replaceAll("_", " ").toLowerCase()}</small> : null}</span>)}</div><small>Répartitions provenant de listes taxonomiques GBIF ; elles ne remplacent pas une carte d’observations.</small></> : <small>Aucune répartition n’est fournie par les listes consultées.</small>}</section>
      </aside>

      <div className="species-detail-main">
        <section className="species-document-section"><span className="species-section-kicker">01 · IDENTITÉ</span><h2>Classification scientifique</h2>{classification.length ? <ol className="species-classification">{classification.map(([rank, name]) => <li key={rank}><span>{rank}</span><strong>{rank === "Espèce" || rank === "Genre" ? <i>{name}</i> : name}</strong></li>)}</ol> : <p>La classification détaillée n’est pas fournie pour ce taxon.</p>}</section>
        <section className="species-document-section"><span className="species-section-kicker">02 · NOMENCLATURE</span><h2>Synonymes scientifiques</h2>{species.synonyms.length ? <ul className="species-synonym-list">{species.synonyms.slice(0, 20).map((synonym) => <li key={synonym.key}><a href={synonym.sourceUrl} target="_blank" rel="noreferrer"><i>{synonym.scientificName}</i></a>{synonym.authorship && <span>{synonym.authorship}</span>}</li>)}</ul> : <p>Aucun synonyme n’est listé dans la source taxonomique consultée.</p>}</section>
        <section className="species-document-section"><span className="species-section-kicker">03 · DESCRIPTION</span><h2>Écologie et cycle de vie</h2><div className="species-data-honesty"><BookOpen size={18} /><p>La fiche taxonomique GBIF ne fournit pas ici de description écologique accompagnée d’une licence de texte vérifiable. TERRA laisse ces rubriques vides plutôt que de présenter une information non sourcée comme un fait.</p></div><div className="species-empty-fields"><span>Alimentation</span><span>Reproduction</span><span>Rôle écologique</span><span>Menaces</span></div></section>
        <section className="species-document-section"><span className="species-section-kicker">04 · ICONOGRAPHIE</span><h2>Photographies documentées</h2>{species.images.length ? <div className="species-image-gallery">{species.images.slice(0, 8).map((image, index) => <figure key={`${image.url}-${index}`}><a href={image.sourceUrl || image.url} target="_blank" rel="noreferrer"><Image src={image.url} alt={image.title || `Image ${index + 1} de ${species.canonicalName}`} width={640} height={420} unoptimized /></a><figcaption><strong>{image.creator || "Auteur non renseigné"}</strong>{image.publisher && <span>Diffuseur : {image.publisher}</span>}<span>{image.license}</span><a href={image.licenseUrl} target="_blank" rel="noreferrer">Licence et conditions</a></figcaption></figure>)}</div> : <p>Aucune photo sous licence CC0, CC BY 4.0 ou CC BY-SA 4.0 avec une adresse sécurisée n’a été trouvée dans les médias GBIF consultés.</p>}</section>
        <section className="species-document-section species-sources-section"><span className="species-section-kicker">05 · TRAÇABILITÉ</span><h2>Sources vérifiables</h2><ul>{species.sources.map((source) => <li key={`${source.type}-${source.url}`}><span>{source.type}</span><a href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowUpRight size={13} /></a></li>)}{species.references.map((reference, index) => <li key={`${reference.url || reference.title}-${index}`}><span>Référence GBIF</span>{reference.url ? <a href={reference.url} target="_blank" rel="noreferrer">{reference.title} <ArrowUpRight size={13} /></a> : <span className="species-reference-no-link">{reference.title}</span>}</li>)}</ul><p>Les noms, la classification et les répartitions sont attribués au registre taxonomique GBIF et à ses sources contributrices. Les observations de la communauté restent séparées de ces données.</p></section>
      </div>
    </div>
    <section className="species-community-cta"><div><span>CONNAISSANCE COLLABORATIVE</span><h2>Vous avez observé cette espèce ?</h2><p>Partagez une observation TERRA. Elle sera visible comme contribution communautaire, distincte de la fiche taxonomique.</p></div><Link href={`/observations?q=${encodeURIComponent(species.canonicalName)}`}>Voir les observations <ArrowUpRight size={15} /></Link></section>
  </main>;
}

function SpeciesUnavailable() {
  return <main className="species-unavailable"><span className="species-eyebrow"><Leaf size={14} /> ENCYCLOPÉDIE TERRA</span><h1>Cette fiche n’est pas disponible.</h1><p>Le service taxonomique GBIF n’a pas fourni de fiche exploitable pour cet identifiant.</p><Link href="/biodiversite"><ArrowLeft size={15} /> Revenir à la recherche</Link></main>;
}

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Camera, Compass, Flower2, Leaf, MapPinned, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { CSSProperties } from "react";

type FeaturedSpecies = {
  key: number;
  canonicalName: string;
  kingdom: string | null;
  class: string | null;
  image: { url: string; title: string | null; creator: string | null; publisher: string | null; license: string; sourceUrl: string | null };
};

const WORLDS = [
  { title: "Explorer les espèces", detail: "Noms, classification et références documentées.", href: "/biodiversite", icon: Leaf, label: "Encyclopédie" },
  { title: "Identifier le vivant", detail: "Photo de plante, insecte ou animal : obtenez des pistes à vérifier.", href: "/identifier", icon: Camera, label: "Reconnaissance" },
  { title: "Partager une rencontre", detail: "Parcourez les observations publiques et retrouvez vos collections dans votre espace.", href: "/explorer?section=observations", icon: MapPinned, label: "Communauté" },
  { title: "Comprendre les écosystèmes", detail: "Explorez les rythmes saisonniers et les co-présences observées sur le terrain.", href: "/ecosystemes", icon: Flower2, label: "Écosystèmes" },
  { title: "Agir sur le terrain", detail: "Découvrez les missions proposées autour de la biodiversité.", href: "/missions", icon: Target, label: "Missions" },
];

const PRACTICE_PATHS = [
  {
    title: "Cultures & jardinage",
    detail: "Une photo peut aider à examiner des symptômes de culture. Le module couvre 38 classes et propose une piste visuelle, pas un diagnostic agronomique.",
    href: "/identifier?mode=disease",
    label: "Examiner une photo",
  },
  {
    title: "Pollinisateurs & saisons",
    detail: "Consultez les périodes et co-présences de plantes et d’insectes observées. Une co-présence ne confirme pas une relation entre espèces.",
    href: "/ecosystemes",
    label: "Explorer les écosystèmes",
  },
  {
    title: "Élevage & pastoralisme",
    detail: "Explorez les fiches taxonomiques d’animaux. Le suivi de troupeaux et les ressources fourragères ne sont pas encore proposés.",
    href: "/biodiversite?kingdom=Animalia",
    label: "Consulter les espèces",
  },
  {
    title: "Études & observation",
    detail: "Recherchez des taxons avec leurs références, ou parcourez le carnet public des rencontres partagées.",
    href: "/biodiversite",
    label: "Ouvrir l’encyclopédie",
  },
];

export default function HomeLanding({ featuredSpecies }: Readonly<{ featuredSpecies: FeaturedSpecies[] }>) {
  return <main className="terra-home">
    <section className="terra-home-hero" aria-labelledby="terra-home-title">
      <Image className="terra-home-hero-image" src="/images/terra-network.webp" alt="Paysage naturel associé à la découverte de la biodiversité" fill priority sizes="100vw" />
      <div className="terra-home-hero-shade" />
      <div className="terra-home-hero-copy">
        <span className="terra-home-eyebrow"><Leaf size={16} /> OBSERVER · COMPRENDRE · TRANSMETTRE · PRÉSERVER</span>
        <h1 id="terra-home-title">Le vivant est partout.<br /><em>Découvrez-le.</em></h1>
        <p>Explorez la biodiversité, identifiez les espèces qui vous entourent et partagez vos découvertes avec une communauté passionnée par la nature.</p>
        <div className="terra-home-actions">
          <Link href="/identifier" className="terra-home-primary"><Camera size={18} /> Identifier une espèce <ArrowRight size={17} /></Link>
          <Link href="/biodiversite" className="terra-home-secondary"><BookOpen size={17} /> Explorer la biodiversité</Link>
        </div>
        <div className="terra-home-trust"><ShieldCheck size={16} /><span>Des pistes d’identification à confirmer, des sources affichées sur les fiches.</span></div>
      </div>
      <a className="terra-home-scroll" href="#decouvrir"><span>Découvrir TERRA</span><ArrowDown size={15} /></a>
    </section>

    <section className="terra-home-worlds" id="decouvrir" aria-labelledby="terra-home-worlds-title">
      <header className="terra-home-section-heading">
        <span>UN MÊME ESPACE, PLUSIEURS FAÇONS D’EXPLORER</span>
        <h2 id="terra-home-worlds-title">Entrez dans le monde vivant.</h2>
        <p>Commencez par une espèce, une observation ou une action de terrain.</p>
      </header>
      <div className="terra-home-world-grid">
        {WORLDS.map(({ title, detail, href, icon: Icon, label }, index) => <Link className="terra-home-world-card" href={href} key={href}>
          <span className="terra-home-world-number">0{index + 1}</span><span className="terra-home-world-icon"><Icon size={21} /></span><small>{label}</small><h3>{title}</h3><p>{detail}</p><span className="terra-home-world-link">Découvrir <ArrowRight size={15} /></span>
        </Link>)}
      </div>
    </section>

    <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="terra-home-practices-title">
      <header className="mb-6 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-[.14em] text-primary-dark">DES OUTILS SELON VOTRE PRATIQUE</span>
        <h2 id="terra-home-practices-title" className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl">Par où souhaitez-vous commencer ?</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/70 sm:text-base">Choisissez un point d’entrée. TERRA vous dirige vers les outils disponibles et précise leurs limites.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PRACTICE_PATHS.map((item) => <article key={item.title} className="flex min-h-56 flex-col rounded-2xl border border-border bg-card-bg p-5 shadow-sm">
          <h3 className="font-serif text-xl font-semibold">{item.title}</h3>
          <p className="mt-3 flex-1 text-sm leading-6 text-foreground/70">{item.detail}</p>
          <Link href={item.href} className="mt-5 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-primary-dark underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{item.label}<ArrowRight size={16} aria-hidden="true" /></Link>
        </article>)}
      </div>
    </section>

    <section className="terra-home-identify" aria-labelledby="terra-home-identify-title">
      <div className="terra-home-identify-art"><Image src="/images/terra-identification.webp" alt="Détail d’une plante observée dans son milieu" fill sizes="(max-width: 760px) 100vw, 45vw" /></div>
      <div className="terra-home-identify-copy"><span><Sparkles size={15} /> UNE PHOTO. UNE DÉCOUVERTE.</span><h2 id="terra-home-identify-title">Une image ouvre<br />tout un monde.</h2><p>Photographiez un organisme, consultez les propositions d’identification, puis explorez les références disponibles. La position reste facultative.</p>
        <ol><li><span>01</span><div><strong>Photographiez</strong><small>Importez une image ou prenez une photo.</small></div></li><li><span>02</span><div><strong>Explorez les pistes</strong><small>Les suggestions automatiques ne remplacent pas une validation scientifique.</small></div></li><li><span>03</span><div><strong>Documentez la rencontre</strong><small>Enregistrez et partagez si vous le souhaitez.</small></div></li></ol>
        <Link href="/identifier" className="terra-home-text-link">Commencer une identification <ArrowRight size={16} /></Link>
      </div>
    </section>

    <section className="terra-home-discoveries" aria-labelledby="terra-home-discoveries-title">
      <header className="terra-home-section-heading terra-home-discoveries-heading"><div><span>RÉFÉRENCES TAXONOMIQUES · GBIF</span><h2 id="terra-home-discoveries-title">Espèces documentées au Sénégal.</h2><p>Une sélection issue d’observations GBIF avec crédits et licences photo consultables.</p></div><Link href="/biodiversite">Parcourir l’encyclopédie <ArrowRight size={15} /></Link></header>
      {featuredSpecies.length ? <div className="terra-home-species-grid">{featuredSpecies.map((species) => <article className="terra-home-species-card" key={species.key}>
        <Link href={`/especes/${species.key}`} className="terra-home-species-photo" aria-label={`Voir la fiche ${species.canonicalName}`} style={{ "--terra-home-species-background": `url(${JSON.stringify(species.image.url)})` } as CSSProperties}>
          <Image src={species.image.url} alt={species.image.title || `Photographie de ${species.canonicalName}`} fill sizes="(max-width: 680px) 100vw, (max-width: 1050px) 50vw, 25vw" unoptimized />
          <span>{species.kingdom || "Espèce documentée"}</span>
        </Link>
        <div className="terra-home-species-copy"><small>{species.class || "Biodiversité"}</small><h3><Link href={`/especes/${species.key}`}><i>{species.canonicalName}</i></Link></h3><p>{species.image.creator || species.image.publisher || "Crédit photo fourni"} · {species.image.license}</p>{species.image.sourceUrl && <a href={species.image.sourceUrl} target="_blank" rel="noreferrer">Voir la source photo</a>}</div>
      </article>)}</div> : <div className="terra-home-species-empty"><p>La sélection d’espèces est momentanément indisponible.</p><Link href="/biodiversite">Rechercher dans l’encyclopédie <ArrowRight size={15} /></Link></div>}
    </section>

    <section className="terra-home-community" aria-labelledby="terra-home-community-title">
      <div className="terra-home-community-mark"><MapPinned size={26} /><span>OBSERVATIONS · ÉCHANGES · CARNETS</span></div>
      <div><h2 id="terra-home-community-title">La nature se découvre aussi ensemble.</h2><p>Parcourez des observations publiques du monde entier. Connectez-vous pour partager les vôtres et retrouver vos collections dans l’espace TERRA.</p></div>
      <Link href="/explorer?section=observations">Explorer les observations <ArrowRight size={16} /></Link>
    </section>

    <section className="terra-home-conservation"><div><span><Compass size={15} /> CONNAÎTRE POUR MIEUX PRÉSERVER</span><h2>Chaque observation peut enrichir la connaissance du vivant.</h2><p>TERRA relie les fiches taxonomiques aux observations de terrain. Les données sensibles restent protégées et les sources sont indiquées lorsqu’elles sont disponibles.</p></div><Link href="/missions">Découvrir les missions <ArrowRight size={16} /></Link></section>
    <footer className="terra-home-footer"><span>TERRA · Le réseau du vivant</span><Link href="/biodiversite">Encyclopédie</Link><Link href="/identifier">Identifier</Link><Link href="/missions">Missions</Link></footer>
  </main>;
}

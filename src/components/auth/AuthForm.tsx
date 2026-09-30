"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import BackLink from "@/components/navigation/BackLink";

type AuthMode = "login" | "signup";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, name, email, password, remember }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Connexion impossible pour le moment.");
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Une erreur est survenue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-photo-panel">
        <Link href="/" className="auth-brand"><span className="auth-brand-mark"><Leaf size={20} /></span><span>TERRA<small>LE RÉSEAU DU VIVANT</small></span></Link>
        <div className="auth-photo-content">
          <span className="auth-kicker"><Sparkles size={14} /> LA NATURE NOUS RELIE</span>
          <h1>Le vivant est<br />plus riche <em>ensemble.</em></h1>
          <p>Chaque observation révèle un peu plus les trésors naturels de notre continent.</p>
          <div className="auth-proof"><div className="auth-proof-avatars"><span>🌿</span><span>🦋</span><span>🐦</span></div><span>Des curieux de la nature<br /><strong>partout en Afrique</strong></span></div>
        </div>
        <div className="auth-photo-caption"><span>12° 33′ N · SÉNÉGAL</span><span>LE MONDE SAUVAGE, TOUT PRÈS</span></div>
      </div>

      <section className="auth-form-panel">
        <BackLink href="/" className="auth-back" label="Retour à l’accueil" />
        <div className="auth-form-card">
          <div className="auth-mobile-mark"><span className="auth-brand-mark"><Leaf size={18} /></span><span>TERRA</span></div>
          <span className="auth-form-kicker">{isSignup ? "VOTRE CARNET COMMENCE ICI" : "HEUREUX DE VOUS RETROUVER"}</span>
          <h2>{isSignup ? "Rejoignez le mouvement." : "Ravi de vous revoir."}</h2>
          <p className="auth-form-intro">{isSignup ? "Créez votre espace et partagez vos rencontres avec le vivant." : "Connectez-vous pour retrouver vos observations et votre communauté."}</p>

          {error && <div className="auth-error" role="alert">{error}</div>}
          <form className="auth-fields" onSubmit={handleSubmit}>
            {isSignup && <label>Votre nom<div className="auth-input-wrap"><UserRound size={17} /><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Awa Ndiaye" required /></div></label>}
            <label>Adresse e-mail<div className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="awa@exemple.com" required /></div></label>
            <label>Mot de passe<div className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "8 caractères minimum" : "Votre mot de passe"} minLength={isSignup ? 8 : undefined} required /><button className="auth-password-toggle" type="button" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {!isSignup && <div className="auth-remember"><label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Se souvenir de moi</label><span><ShieldCheck size={14} /> Session sécurisée</span></div>}
            <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Un instant…" : isSignup ? "Créer mon compte" : "Me connecter"}<ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{isSignup ? "Déjà parmi nous ?" : "Vous découvrez TERRA ?"} <Link href={isSignup ? "/connexion" : "/inscription"}>{isSignup ? "Se connecter" : "Créer un compte"}</Link></p>
          <div className="auth-privacy"><ShieldCheck size={15} /> Vos observations et vos données restent protégées.</div>
        </div>
      </section>
    </main>
  );
}

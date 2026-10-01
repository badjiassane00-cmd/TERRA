import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email && !password) {
    console.log("Bootstrap super-admin ignoré : variables d’environnement absentes.");
    return;
  }
  if (!email || !password) throw new Error("SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD doivent être définis ensemble.");
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12) {
    throw new Error("Email super-admin invalide ou mot de passe de moins de 12 caractères.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: { email, name: "Super administrateur", password: passwordHash, role: "SUPER_ADMIN" },
    update: { password: passwordHash, role: "SUPER_ADMIN" },
  });
  console.log(`Compte super-admin initialisé : ${email}`);
}

main().catch((error: unknown) => {
  console.error("Initialisation super-admin impossible.", error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
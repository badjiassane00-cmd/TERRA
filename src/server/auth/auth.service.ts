import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { authRepository } from "./auth.repository";

export class AuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AuthError";
  }
}

export const authService = {
  normalizePhone(value: string) {
    const normalized = value.trim().replace(/[\s().-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      throw new AuthError("Saisissez un numéro international au format +221…", 400);
    }
    return normalized;
  },

  async authenticate(identifier: string, password: string) {
    const normalized = identifier.trim().toLowerCase();
    const phone = normalized.startsWith("+") ? this.normalizePhone(identifier) : null;
    const user = await authRepository.findUserByIdentifier(normalized, phone);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthError("Identifiant ou mot de passe incorrect", 401);
    }
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    if (superAdminEmail && user.email === superAdminEmail && user.role !== "SUPER_ADMIN") {
      return authRepository.updateRole(user.id, "SUPER_ADMIN");
    }
    return user;
  },

  async register(input: { email?: string; phoneNumber?: string; password: string; name: string }) {
    const rawEmail = input.email?.trim().toLowerCase() || "";
    const phone = input.phoneNumber?.trim() ? this.normalizePhone(input.phoneNumber) : null;
    if (!rawEmail && !phone) throw new AuthError("Saisissez une adresse e-mail ou un numéro de téléphone.", 400);
    if (rawEmail && !/^\S+@\S+\.\S+$/.test(rawEmail)) throw new AuthError("Adresse e-mail invalide.", 400);
    const email = rawEmail || `phone.${phone!.slice(1)}@accounts.terra.invalid`;
    const name = input.name.trim();
    if (!name) {
      throw new AuthError("Votre nom est requis", 400);
    }
    if (input.password.length < 8) {
      throw new AuthError("Le mot de passe doit contenir au moins 8 caractères", 400);
    }
    if (await authRepository.findUserByIdentifier(email, phone)) {
      throw new AuthError("Un compte existe déjà avec cet identifiant.", 409);
    }
    const isSuperAdmin = !!process.env.SUPER_ADMIN_EMAIL && email === process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase();

    try {
      return await authRepository.createUser({
        email,
        name,
        authPhone: phone,
        phoneNumber: phone,
        role: isSuperAdmin ? "SUPER_ADMIN" : "USER",
        password: await bcrypt.hash(input.password, 12),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AuthError("Un compte existe déjà avec cet identifiant.", 409);
      }
      throw error;
    }
  },
};

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
  async authenticate(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthError("Email ou mot de passe incorrect", 401);
    }
    return user;
  },

  async register(input: { email: string; password: string; name: string }) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!name) {
      throw new AuthError("Votre nom est requis", 400);
    }
    if (input.password.length < 8) {
      throw new AuthError("Le mot de passe doit contenir au moins 8 caractères", 400);
    }
    if (await authRepository.findUserByEmail(email)) {
      throw new AuthError("Un compte existe déjà avec cette adresse email", 409);
    }

    try {
      return await authRepository.createUser({
        email,
        name,
        password: await bcrypt.hash(input.password, 12),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AuthError("Un compte existe déjà avec cette adresse email", 409);
      }
      throw error;
    }
  },
};

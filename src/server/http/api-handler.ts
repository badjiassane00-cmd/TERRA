import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(message: string, public readonly status = 500, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
  }
}

type AsyncHandler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

/** Shared boundary for route handlers: logs unexpected errors and returns a stable JSON error shape. */
export function withApiErrors<Args extends unknown[]>(handler: AsyncHandler<Args>): AsyncHandler<Args> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("Unhandled API route error:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  };
}

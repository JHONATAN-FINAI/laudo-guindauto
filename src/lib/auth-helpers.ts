import { auth } from "@/lib/auth";

/** Retorna o user_id da sessão ou null se não autenticado */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

import { db } from "@/lib/db";
import { engenheiros } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const lista = await db.select().from(engenheiros).where(eq(engenheiros.user_id, userId)).orderBy(desc(engenheiros.created_at));
  return NextResponse.json(lista);
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await request.json();
  const { nome, crea_numero, crea_estado, especialidade } = body;
  if (!nome?.trim() || !crea_numero?.trim() || !crea_estado?.trim())
    return NextResponse.json({ error: "Nome, CREA número e estado são obrigatórios" }, { status: 400 });
  const [eng] = await db.insert(engenheiros).values({
    user_id: userId,
    nome: nome.trim(),
    crea_numero: crea_numero.trim(),
    crea_estado: crea_estado.trim().toUpperCase(),
    especialidade: especialidade?.trim() || "Engenheiro Mecânico",
  }).returning();
  return NextResponse.json(eng, { status: 201 });
}

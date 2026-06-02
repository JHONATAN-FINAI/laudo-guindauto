import { db } from "@/lib/db";
import { engenheiros } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await request.json();
  const { nome, crea_numero, crea_estado, especialidade, ativo } = body;
  if (!nome?.trim() || !crea_numero?.trim() || !crea_estado?.trim())
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  const [eng] = await db.update(engenheiros).set({
    nome: nome.trim(), crea_numero: crea_numero.trim(),
    crea_estado: crea_estado.trim().toUpperCase(),
    especialidade: especialidade?.trim() || "Engenheiro Mecânico",
    ativo: ativo || "sim",
  }).where(and(eq(engenheiros.id, id), eq(engenheiros.user_id, userId))).returning();
  if (!eng) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(eng);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const [deleted] = await db.delete(engenheiros)
    .where(and(eq(engenheiros.id, id), eq(engenheiros.user_id, userId)))
    .returning({ id: engenheiros.id });
  if (!deleted) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

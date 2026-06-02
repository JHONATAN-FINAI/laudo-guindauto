import { db } from "@/lib/db";
import { engenheiros } from "@/lib/db/schema";
import { laudos, proprietarios, implementos, veiculos, caracteristicas_veiculo, itens_inspecao, fotos_laudo, users } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/laudos/[id] - Laudo completo com todas as relações
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db
    .select()
    .from(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId)))
    .limit(1);

  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });

  const [prop] = await db.select().from(proprietarios).where(eq(proprietarios.laudo_id, id)).limit(1);
  const [impl] = await db.select().from(implementos).where(eq(implementos.laudo_id, id)).limit(1);
  const [veic] = await db.select().from(veiculos).where(eq(veiculos.laudo_id, id)).limit(1);
  const [carac] = await db.select().from(caracteristicas_veiculo).where(eq(caracteristicas_veiculo.laudo_id, id)).limit(1);
  const itens = await db.select().from(itens_inspecao).where(eq(itens_inspecao.laudo_id, id));
  const fotos = await db.select().from(fotos_laudo).where(eq(fotos_laudo.laudo_id, id)).orderBy(asc(fotos_laudo.ordem));
  const [user] = await db.select({ nome: users.nome, crea_numero: users.crea_numero, crea_estado: users.crea_estado }).from(users).where(eq(users.id, userId)).limit(1);

  // Engenheiro vinculado
  const engenheiro = laudo.engenheiro_id
    ? (await db.select().from(engenheiros).where(eq(engenheiros.id, laudo.engenheiro_id)).limit(1))[0] || null
    : null;

  return NextResponse.json({
    ...laudo,
    proprietarios: prop || null,
    implementos: impl || null,
    veiculos: veic || null,
    caracteristicas_veiculo: carac || null,
    itens_inspecao: itens,
    fotos_laudo: fotos,
    user: user || null,
    engenheiro: engenheiro || null,
  });
}

// PUT /api/laudos/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const camposPermitidos = ["data_inspecao", "art_numero"];
  const updates: Record<string, any> = { updated_at: new Date() };
  for (const campo of camposPermitidos) {
    if (body[campo] !== undefined) updates[campo] = body[campo];
  }

  const [data] = await db
    .update(laudos)
    .set(updates)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId)))
    .returning();

  if (!data) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE /api/laudos/[id]
export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [deleted] = await db
    .delete(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId)))
    .returning({ id: laudos.id });

  if (!deleted) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

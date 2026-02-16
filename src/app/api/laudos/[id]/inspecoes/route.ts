import { db } from "@/lib/db";
import { laudos, itens_inspecao } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db.select({ id: laudos.id }).from(laudos).where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });

  const { itens } = await request.json();
  if (!Array.isArray(itens)) {
    return NextResponse.json({ error: "Campo 'itens' deve ser um array" }, { status: 400 });
  }

  // Atualiza cada item
  const erros: string[] = [];
  for (const item of itens) {
    try {
      await db
        .update(itens_inspecao)
        .set({
          situacao: item.situacao,
          observacoes: item.observacoes || null,
          foto_url: item.foto_url || null,
        })
        .where(and(eq(itens_inspecao.id, item.id), eq(itens_inspecao.laudo_id, id)));
    } catch (e: any) {
      erros.push(e.message);
    }
  }

  if (erros.length > 0) {
    return NextResponse.json({ error: `${erros.length} itens falharam`, detalhes: erros }, { status: 500 });
  }

  // Atualiza updated_at do laudo
  await db.update(laudos).set({ updated_at: new Date() }).where(eq(laudos.id, id));

  return NextResponse.json({ ok: true, atualizados: itens.length });
}

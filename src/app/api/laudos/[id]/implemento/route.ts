import { db } from "@/lib/db";
import { laudos, implementos } from "@/lib/db/schema";
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

  const body = await request.json();

  const [data] = await db
    .update(implementos)
    .set({
      fabricante: body.fabricante,
      modelo: body.modelo,
      numero_serie: body.numero_serie,
      ano_fabricacao: body.ano_fabricacao,
      peso: body.peso,
      pressao_trabalho: body.pressao_trabalho,
      capacidade_carga: body.capacidade_carga,
      alcance_horizontal: body.alcance_horizontal,
      alcance_vertical: body.alcance_vertical,
      angulo_giro: body.angulo_giro,
      horimetro: body.horimetro,
    })
    .where(eq(implementos.laudo_id, id))
    .returning();

  return NextResponse.json(data);
}

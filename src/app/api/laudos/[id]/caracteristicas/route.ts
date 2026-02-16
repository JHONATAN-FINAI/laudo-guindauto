import { db } from "@/lib/db";
import { laudos, caracteristicas_veiculo } from "@/lib/db/schema";
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
    .update(caracteristicas_veiculo)
    .set({
      distancia_entre_eixos: body.distancia_entre_eixos,
      comprimento_total: body.comprimento_total,
      comprimento_carroceria: body.comprimento_carroceria,
      largura: body.largura, altura: body.altura,
      qtd_eixos_rodas: body.qtd_eixos_rodas,
      eixos_motrizes: body.eixos_motrizes,
      pbtc: body.pbtc, cmt: body.cmt,
    })
    .where(eq(caracteristicas_veiculo.laudo_id, id))
    .returning();

  return NextResponse.json(data);
}

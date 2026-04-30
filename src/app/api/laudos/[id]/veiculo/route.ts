import { db } from "@/lib/db";
import { laudos, veiculos } from "@/lib/db/schema";
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
    .update(veiculos)
    .set({
      tipo: body.tipo, placa: body.placa, ano_modelo: body.ano_modelo,
      chassi: body.chassi, renavan: body.renavan, marca_modelo: body.marca_modelo,
      num_eixos: body.num_eixos, pbtc: body.pbtc, hodometro: body.hodometro,
    })
    .where(eq(veiculos.laudo_id, id))
    .returning();

  return NextResponse.json(data);
}

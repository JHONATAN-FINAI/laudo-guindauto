import { db } from "@/lib/db";
import {
  laudos,
  proprietarios,
  implementos,
  veiculos,
} from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, desc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { criarEstruturaLaudo } from "@/lib/laudos/seed";

// GET /api/laudos
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status") as
    | "rascunho"
    | "finalizado"
    | null;

  const conditions = [eq(laudos.user_id, userId)];
  if (status) conditions.push(eq(laudos.status, status));

  const resultado = await db
    .select()
    .from(laudos)
    .where(and(...conditions))
    .orderBy(desc(laudos.updated_at));

  // Busca dados resumidos de relações em paralelo (batch por laudo)
  const laudosComRelacoes = await Promise.all(
    resultado.map(async (l) => {
      const [prop, veic, impl] = await Promise.all([
        db
          .select({ razao_social: proprietarios.razao_social, cnpj: proprietarios.cnpj })
          .from(proprietarios)
          .where(eq(proprietarios.laudo_id, l.id))
          .limit(1),
        db
          .select({ placa: veiculos.placa, marca_modelo: veiculos.marca_modelo })
          .from(veiculos)
          .where(eq(veiculos.laudo_id, l.id))
          .limit(1),
        db
          .select({ fabricante: implementos.fabricante, modelo: implementos.modelo })
          .from(implementos)
          .where(eq(implementos.laudo_id, l.id))
          .limit(1),
      ]);
      return {
        ...l,
        proprietarios: prop[0] ?? null,
        veiculos: veic[0] ?? null,
        implementos: impl[0] ?? null,
      };
    })
  );

  return NextResponse.json(laudosComRelacoes);
}

// POST /api/laudos
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db.insert(laudos).values({ user_id: userId }).returning();

  await criarEstruturaLaudo(laudo.id);

  return NextResponse.json(laudo, { status: 201 });
}

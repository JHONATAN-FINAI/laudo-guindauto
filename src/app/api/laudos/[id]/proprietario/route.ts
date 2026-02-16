import { db } from "@/lib/db";
import { laudos, proprietarios } from "@/lib/db/schema";
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
    .update(proprietarios)
    .set({
      cnpj: body.cnpj,
      razao_social: body.razao_social,
      endereco: body.endereco,
      email: body.email,
      telefone: body.telefone,
    })
    .where(eq(proprietarios.laudo_id, id))
    .returning();

  return NextResponse.json(data);
}

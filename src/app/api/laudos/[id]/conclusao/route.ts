import { db } from "@/lib/db";
import { laudos } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();

  if (body.conclusao && !["apto", "nao_apto"].includes(body.conclusao)) {
    return NextResponse.json({ error: "Conclusão deve ser 'apto' ou 'nao_apto'" }, { status: 400 });
  }

  const [data] = await db
    .update(laudos)
    .set({
      conclusao: body.conclusao || null,
      art_numero: body.art_numero || null,
      updated_at: new Date(),
    })
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId)))
    .returning();

  if (!data) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

import { db } from "@/lib/db";
import { laudos, fotos_laudo } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; fotoId: string }> };

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id, fotoId } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db.select({ id: laudos.id, status: laudos.status }).from(laudos).where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  if (laudo.status === "finalizado") return NextResponse.json({ error: "Laudo finalizado não pode ser editado" }, { status: 400 });

  const [foto] = await db.select().from(fotos_laudo).where(and(eq(fotos_laudo.id, fotoId), eq(fotos_laudo.laudo_id, id))).limit(1);
  if (!foto) return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });

  // Remove do Vercel Blob
  try { await del(foto.storage_url); } catch {}

  await db.delete(fotos_laudo).where(eq(fotos_laudo.id, fotoId));
  return NextResponse.json({ ok: true });
}

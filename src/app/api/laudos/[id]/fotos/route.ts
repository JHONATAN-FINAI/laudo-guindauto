import { db } from "@/lib/db";
import { laudos, fotos_laudo } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and, asc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type Params = { params: Promise<{ id: string }> };

// Detecta se Vercel Blob está configurado
const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

async function uploadArquivo(arquivo: File, pathname: string): Promise<string> {
  if (HAS_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, arquivo, {
      access: "public",
      contentType: arquivo.type,
    });
    return blob.url;
  } else {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", path.dirname(pathname));
    await mkdir(dir, { recursive: true });
    const filePath = path.join(process.cwd(), "public", "uploads", pathname);
    await writeFile(filePath, buffer);
    return `/uploads/${pathname}`;
  }
}

async function deleteArquivo(url: string): Promise<void> {
  if (HAS_BLOB) {
    const { del } = await import("@vercel/blob");
    try { await del(url); } catch { /* ignore */ }
  }
}

// GET /api/laudos/[id]/fotos
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db.select({ id: laudos.id }).from(laudos).where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });

  const fotos = await db.select().from(fotos_laudo).where(eq(fotos_laudo.laudo_id, id)).orderBy(asc(fotos_laudo.ordem));
  return NextResponse.json(fotos);
}

// POST /api/laudos/[id]/fotos - Upload
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db.select({ id: laudos.id, status: laudos.status }).from(laudos).where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  if (laudo.status === "finalizado") return NextResponse.json({ error: "Laudo finalizado não pode ser editado" }, { status: 400 });

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File;
  const tipo = formData.get("tipo") as string;
  const legenda = (formData.get("legenda") as string) || null;

  if (!arquivo || !tipo) {
    return NextResponse.json({ error: "Arquivo e tipo são obrigatórios" }, { status: 400 });
  }

  const extensao = arquivo.name.split(".").pop() || "jpg";
  const pathname = `laudos/${userId}/${id}/${tipo}_${Date.now()}.${extensao}`;
  const storageUrl = await uploadArquivo(arquivo, pathname);

  if (!tipo.startsWith("extra_")) {
    const [fotoExistente] = await db
      .select()
      .from(fotos_laudo)
      .where(and(eq(fotos_laudo.laudo_id, id), eq(fotos_laudo.tipo, tipo as any)))
      .limit(1);

    if (fotoExistente) {
      await deleteArquivo(fotoExistente.storage_url);
      await db.delete(fotos_laudo).where(eq(fotos_laudo.id, fotoExistente.id));
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fotos_laudo)
    .where(eq(fotos_laudo.laudo_id, id));

  const [foto] = await db
    .insert(fotos_laudo)
    .values({
      laudo_id: id,
      tipo: tipo as any,
      storage_url: storageUrl,
      legenda,
      ordem: (count || 0) + 1,
    })
    .returning();

  return NextResponse.json({ ...foto, url: storageUrl }, { status: 201 });
}

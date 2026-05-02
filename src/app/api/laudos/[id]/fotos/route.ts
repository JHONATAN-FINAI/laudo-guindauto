import { db } from "@/lib/db";
import { laudos, fotos_laudo } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and, asc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// Vercel Blob é obrigatório em produção
const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

async function uploadArquivo(arquivo: File, pathname: string): Promise<string> {
  if (HAS_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, arquivo, {
      access: "public",
      contentType: arquivo.type || "image/jpeg",
    });
    return blob.url;
  }

  // Fallback local (apenas dev): salva em /tmp que é gravável até em serverless
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const dir = path.join("/tmp", "uploads", path.dirname(pathname));
  await mkdir(dir, { recursive: true });
  const filePath = path.join("/tmp", "uploads", pathname);
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(filePath, buffer);
  // Retorna URL pública servida pela rota /api/uploads/[...path]
  return `/api/uploads/${pathname}`;
}

async function deleteArquivo(url: string): Promise<void> {
  if (!HAS_BLOB || !url.includes("vercel-storage") && !url.includes("blob.vercel")) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch { /* ignore */ }
}

// GET /api/laudos/[id]/fotos
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db
    .select({ id: laudos.id })
    .from(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId)))
    .limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });

  const fotos = await db
    .select()
    .from(fotos_laudo)
    .where(eq(fotos_laudo.laudo_id, id))
    .orderBy(asc(fotos_laudo.ordem));

  return NextResponse.json(fotos);
}

// POST /api/laudos/[id]/fotos
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db
    .select({ id: laudos.id, status: laudos.status })
    .from(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId)))
    .limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  if (laudo.status === "finalizado")
    return NextResponse.json({ error: "Laudo finalizado não pode ser editado" }, { status: 400 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Erro ao processar formulário" }, { status: 400 });
  }

  const arquivo = formData.get("arquivo") as File | null;
  const tipo = (formData.get("tipo") as string | null)?.trim();
  const legenda = (formData.get("legenda") as string | null) || null;

  if (!arquivo || !tipo) {
    return NextResponse.json({ error: "Arquivo e tipo são obrigatórios" }, { status: 400 });
  }

  if (arquivo.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 8MB)" }, { status: 413 });
  }

  // Normaliza extensão — canvas comprimido sempre vira .jpg
  const extensao = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
  const pathname = `laudos/${userId}/${id}/${tipo}_${Date.now()}.${extensao}`;

  let storageUrl: string;
  try {
    storageUrl = await uploadArquivo(arquivo, pathname);
  } catch (err) {
    console.error("Erro no upload:", err);
    return NextResponse.json(
      { error: "Falha no upload. Verifique a variável BLOB_READ_WRITE_TOKEN." },
      { status: 500 }
    );
  }

  // Substitui foto existente do mesmo tipo (exceto extras que podem ser múltiplas)
  if (!tipo.startsWith("extra_")) {
    try {
      const [fotoExistente] = await db
        .select()
        .from(fotos_laudo)
        .where(and(eq(fotos_laudo.laudo_id, id), eq(fotos_laudo.tipo, tipo as any)))
        .limit(1);

      if (fotoExistente) {
        await deleteArquivo(fotoExistente.storage_url);
        await db.delete(fotos_laudo).where(eq(fotos_laudo.id, fotoExistente.id));
      }
    } catch { /* continua mesmo se delete falhar */ }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fotos_laudo)
    .where(eq(fotos_laudo.laudo_id, id));

  try {
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
  } catch (err: any) {
    console.error("Erro ao salvar foto no banco:", err);
    // Erro de enum = tipo não existe no banco
    if (err?.message?.includes("invalid input value for enum")) {
      return NextResponse.json(
        { error: `Tipo de foto inválido no banco: "${tipo}". Execute a migration SQL para adicionar o valor ao enum tipo_foto.` },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Erro ao salvar foto" }, { status: 500 });
  }
}

// DELETE /api/laudos/[id]/fotos?fotoId=xxx
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const fotoId = request.nextUrl.searchParams.get("fotoId");
  if (!fotoId) return NextResponse.json({ error: "fotoId obrigatório" }, { status: 400 });

  const [laudo] = await db
    .select({ id: laudos.id })
    .from(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId)))
    .limit(1);
  if (!laudo) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const [foto] = await db
    .select()
    .from(fotos_laudo)
    .where(and(eq(fotos_laudo.id, fotoId), eq(fotos_laudo.laudo_id, id)))
    .limit(1);

  if (foto) {
    await deleteArquivo(foto.storage_url);
    await db.delete(fotos_laudo).where(eq(fotos_laudo.id, fotoId));
  }

  return NextResponse.json({ ok: true });
}

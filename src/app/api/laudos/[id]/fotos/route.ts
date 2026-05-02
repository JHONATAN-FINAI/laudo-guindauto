import { db } from "@/lib/db";
import { laudos, fotos_laudo } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and, asc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// Garante que o enum tem todos os valores necessários antes de qualquer INSERT
async function ensureEnumValues() {
  const rawSql = neon(process.env.DATABASE_URL!);
  const valores = [
    "capa","placa","guindaste","alavancas",
    "botao_emergencia","controle_remoto","plaqueta",
    "tabela_cargas","grafico_cargas","mangueiras",
    "valvulas","estabilizadores","horimetro",
    "lateral_dianteira_esq","lateral_dianteira_dir",
    "lateral_traseira_esq","lateral_traseira_dir",
    "extra_1","extra_2","extra_3",
  ];
  for (const v of valores) {
    try {
      await rawSql(`ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS '${v}'`);
    } catch { /* já existe ou outro erro não crítico */ }
  }
}

async function uploadArquivo(arquivo: File, pathname: string): Promise<string> {
  if (HAS_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, arquivo, {
      access: "public",
      contentType: arquivo.type || "image/jpeg",
    });
    return blob.url;
  }
  // Fallback dev — salva em /tmp
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const dir = path.join("/tmp", "uploads", path.dirname(pathname));
  await mkdir(dir, { recursive: true });
  const filePath = path.join("/tmp", "uploads", pathname);
  await writeFile(filePath, Buffer.from(await arquivo.arrayBuffer()));
  return `/api/uploads/${pathname}`;
}

async function deleteArquivo(url: string) {
  if (!HAS_BLOB || (!url.includes("vercel-storage") && !url.includes("blob.vercel"))) return;
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

  const [laudo] = await db.select({ id: laudos.id }).from(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const fotos = await db.select().from(fotos_laudo)
    .where(eq(fotos_laudo.laudo_id, id)).orderBy(asc(fotos_laudo.ordem));

  return NextResponse.json(fotos);
}

// POST /api/laudos/[id]/fotos
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db.select({ id: laudos.id, status: laudos.status }).from(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (laudo.status === "finalizado")
    return NextResponse.json({ error: "Laudo finalizado" }, { status: 400 });

  if (!HAS_BLOB) {
    return NextResponse.json(
      { error: "Armazenamento não configurado. Adicione BLOB_READ_WRITE_TOKEN nas variáveis de ambiente da Vercel." },
      { status: 500 }
    );
  }

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

  // Garante enum atualizado antes do INSERT
  await ensureEnumValues();

  const ext = arquivo.type === "image/png" ? "png" : "jpg";
  const pathname = `laudos/${userId}/${id}/${tipo}_${Date.now()}.${ext}`;

  let storageUrl: string;
  try {
    storageUrl = await uploadArquivo(arquivo, pathname);
  } catch (err: any) {
    console.error("Erro no upload:", err);
    return NextResponse.json(
      { error: `Falha no upload: ${err?.message || "erro desconhecido"}` },
      { status: 500 }
    );
  }

  // Remove foto anterior do mesmo tipo (exceto extras)
  if (!tipo.startsWith("extra_")) {
    try {
      const [antiga] = await db.select().from(fotos_laudo)
        .where(and(eq(fotos_laudo.laudo_id, id), eq(fotos_laudo.tipo, tipo as any))).limit(1);
      if (antiga) {
        await deleteArquivo(antiga.storage_url);
        await db.delete(fotos_laudo).where(eq(fotos_laudo.id, antiga.id));
      }
    } catch { /* continua */ }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fotos_laudo).where(eq(fotos_laudo.laudo_id, id));

  try {
    const [foto] = await db.insert(fotos_laudo).values({
      laudo_id: id,
      tipo: tipo as any,
      storage_url: storageUrl,
      legenda,
      ordem: (count || 0) + 1,
    }).returning();

    return NextResponse.json({ ...foto, url: storageUrl }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao salvar foto:", err);
    return NextResponse.json({ error: `Erro ao salvar: ${err?.message}` }, { status: 500 });
  }
}

// DELETE /api/laudos/[id]/fotos?fotoId=xxx
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const fotoId = request.nextUrl.searchParams.get("fotoId");
  if (!fotoId) return NextResponse.json({ error: "fotoId obrigatório" }, { status: 400 });

  const [laudo] = await db.select({ id: laudos.id }).from(laudos)
    .where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const [foto] = await db.select().from(fotos_laudo)
    .where(and(eq(fotos_laudo.id, fotoId), eq(fotos_laudo.laudo_id, id))).limit(1);

  if (foto) {
    await deleteArquivo(foto.storage_url);
    await db.delete(fotos_laudo).where(eq(fotos_laudo.id, fotoId));
  }

  return NextResponse.json({ ok: true });
}

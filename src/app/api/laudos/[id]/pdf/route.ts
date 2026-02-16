import { db } from "@/lib/db";
import { laudos, proprietarios, implementos, veiculos, caracteristicas_veiculo, itens_inspecao, fotos_laudo, users, textos_padrao } from "@/lib/db/schema";
import { gerarPDF, type DadosPDF } from "@/lib/pdf/generate";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Busca laudo
  const [laudo] = await db.select().from(laudos).where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });

  // Busca relações
  const [prop] = await db.select().from(proprietarios).where(eq(proprietarios.laudo_id, id)).limit(1);
  const [impl] = await db.select().from(implementos).where(eq(implementos.laudo_id, id)).limit(1);
  const [veic] = await db.select().from(veiculos).where(eq(veiculos.laudo_id, id)).limit(1);
  const [carac] = await db.select().from(caracteristicas_veiculo).where(eq(caracteristicas_veiculo.laudo_id, id)).limit(1);
  const itens = await db.select().from(itens_inspecao).where(eq(itens_inspecao.laudo_id, id));
  const fotos = await db.select().from(fotos_laudo).where(eq(fotos_laudo.laudo_id, id)).orderBy(asc(fotos_laudo.ordem));
  const [perfil] = await db.select({ nome: users.nome, crea_numero: users.crea_numero, crea_estado: users.crea_estado }).from(users).where(eq(users.id, userId)).limit(1);

  // Busca textos padrão
  const textosRaw = await db.select({ chave: textos_padrao.chave, conteudo: textos_padrao.conteudo }).from(textos_padrao);
  const textosMap: Record<string, string> = {};
  for (const t of textosRaw) textosMap[t.chave] = t.conteudo;

  // Fotos já têm URL direta (storage_url do Vercel Blob)
  const fotosComUrl = fotos.map((f: typeof fotos[number]) => ({ ...f, url: f.storage_url }));

  const dadosPDF: DadosPDF = {
    laudo,
    proprietario: prop || null,
    implemento: impl || null,
    veiculo: veic || null,
    caracteristicas: carac || null,
    itens_inspecao: itens,
    fotos: fotosComUrl,
    textos_padrao: textosMap,
    user: {
      nome: perfil?.nome || "—",
      crea_numero: perfil?.crea_numero || "",
      crea_estado: perfil?.crea_estado || "",
    },
  };

  try {
    const pdfBuffer = await gerarPDF(dadosPDF);
    const nomeArquivo = laudo.numero_inspecao
      ? `laudo_${laudo.numero_inspecao.replace("/", "-")}.pdf`
      : `laudo_rascunho_${id.slice(0, 8)}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nomeArquivo}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    console.error("Erro ao gerar PDF:", e);
    return NextResponse.json({ error: "Erro ao gerar PDF", detalhes: e.message }, { status: 500 });
  }
}

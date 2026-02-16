import { db } from "@/lib/db";
import { laudos, itens_inspecao, fotos_laudo, users } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, and, sql, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Busca laudo
  const [laudo] = await db.select().from(laudos).where(and(eq(laudos.id, id), eq(laudos.user_id, userId))).limit(1);
  if (!laudo) return NextResponse.json({ error: "Laudo não encontrado" }, { status: 404 });
  if (laudo.status === "finalizado") return NextResponse.json({ error: "Laudo já está finalizado" }, { status: 400 });

  // Validações
  const pendencias: string[] = [];

  if (!laudo.conclusao) pendencias.push("Conclusão não definida (APTO/NÃO APTO)");
  if (!laudo.art_numero) pendencias.push("Número da ART não informado");

  // Verifica CREA
  const [perfil] = await db.select({ crea_numero: users.crea_numero }).from(users).where(eq(users.id, userId)).limit(1);
  if (!perfil?.crea_numero) pendencias.push("CREA não cadastrado no perfil");

  // Itens não avaliados
  const [{ count: naoAvaliados }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(itens_inspecao)
    .where(and(eq(itens_inspecao.laudo_id, id), isNull(itens_inspecao.situacao)));

  if (naoAvaliados > 0) pendencias.push(`${naoAvaliados} item(ns) de inspeção não avaliados`);

  // Foto de capa
  const [temCapa] = await db
    .select({ id: fotos_laudo.id })
    .from(fotos_laudo)
    .where(and(eq(fotos_laudo.laudo_id, id), eq(fotos_laudo.tipo, "capa")))
    .limit(1);

  if (!temCapa) pendencias.push("Foto de capa obrigatória");

  if (pendencias.length > 0) {
    return NextResponse.json({ error: "Laudo com pendências", pendencias }, { status: 400 });
  }

  // Gera numero_inspecao: ANO/SEQUENCIAL (ex: 2026/0001)
  const ano = new Date().getFullYear();
  const [{ count: totalAno }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(laudos)
    .where(and(
      eq(laudos.status, "finalizado"),
      sql`extract(year from ${laudos.created_at}) = ${ano}`
    ));

  const sequencial = String((totalAno || 0) + 1).padStart(4, "0");
  const numeroInspecao = `${ano}/${sequencial}`;

  // Define data_inspecao como hoje se não foi preenchida
  const dataInspecaoStr = laudo.data_inspecao || new Date().toISOString().split("T")[0];

  // Calcula validade (+12 meses da data de inspeção)
  const dataInspecao = new Date(dataInspecaoStr + "T12:00:00");
  const dataValidade = new Date(dataInspecao);
  dataValidade.setFullYear(dataValidade.getFullYear() + 1);
  const dataValidadeStr = dataValidade.toISOString().split("T")[0];

  // Atualiza laudo
  const [laudoFinalizado] = await db
    .update(laudos)
    .set({
      status: "finalizado",
      numero_inspecao: numeroInspecao,
      data_inspecao: dataInspecaoStr,
      data_validade: dataValidadeStr,
      updated_at: new Date(),
    })
    .where(eq(laudos.id, id))
    .returning();

  return NextResponse.json({
    ...laudoFinalizado,
    mensagem: "Laudo finalizado com sucesso",
  });
}

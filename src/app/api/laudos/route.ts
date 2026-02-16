import { db } from "@/lib/db";
import { laudos, proprietarios, implementos, veiculos, caracteristicas_veiculo, itens_inspecao } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq, desc, and, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Seed dos 36 itens de inspeção ao criar laudo
const ITENS_SEED = [
  { secao: "5.1", numero_item: "5.1.01", descricao: "Estrutura principal (coluna, lança e articulações)" },
  { secao: "5.1", numero_item: "5.1.02", descricao: "Estado geral de conservação e pintura" },
  { secao: "5.1", numero_item: "5.1.03", descricao: "Soldas estruturais (trincas, corrosão)" },
  { secao: "5.1", numero_item: "5.1.04", descricao: "Pinos e travas de articulação" },
  { secao: "5.1", numero_item: "5.1.05", descricao: "Cilindros hidráulicos (vazamentos, fixação)" },
  { secao: "5.1", numero_item: "5.1.06", descricao: "Mangueiras e conexões hidráulicas" },
  { secao: "5.1", numero_item: "5.1.07", descricao: "Reservatório de óleo hidráulico (nível, estado)" },
  { secao: "5.2", numero_item: "5.2.01", descricao: "Bomba hidráulica (ruídos, vazamentos)" },
  { secao: "5.2", numero_item: "5.2.02", descricao: "Válvulas de controle direcional" },
  { secao: "5.2", numero_item: "5.2.03", descricao: "Válvula de alívio de pressão" },
  { secao: "5.2", numero_item: "5.2.04", descricao: "Filtros hidráulicos (estado, validade)" },
  { secao: "5.2", numero_item: "5.2.05", descricao: "Alavancas e comandos de operação" },
  { secao: "5.2", numero_item: "5.2.06", descricao: "Tomada de força (PTO)" },
  { secao: "5.2", numero_item: "5.2.07", descricao: "Sistema de giro (coroa, rolamento, motor)" },
  { secao: "5.3", numero_item: "5.3.01", descricao: "Estabilizadores (patolas) - estrutura" },
  { secao: "5.3", numero_item: "5.3.02", descricao: "Estabilizadores - cilindros e travas" },
  { secao: "5.3", numero_item: "5.3.03", descricao: "Estabilizadores - sapatas e base de apoio" },
  { secao: "5.3", numero_item: "5.3.04", descricao: "Estabilizadores - extensão e recolhimento" },
  { secao: "5.3", numero_item: "5.3.05", descricao: "Nivelamento do equipamento" },
  { secao: "5.3", numero_item: "5.3.06", descricao: "Indicador de nível (bolha)" },
  { secao: "5.3", numero_item: "5.3.07", descricao: "Fixação da coluna ao chassi/subframe" },
  { secao: "5.4", numero_item: "5.4.01", descricao: "Gancho de carga (trava de segurança)" },
  { secao: "5.4", numero_item: "5.4.02", descricao: "Cabo de aço / corrente de içamento" },
  { secao: "5.4", numero_item: "5.4.03", descricao: "Guincho / moitão (estado, fixação)" },
  { secao: "5.4", numero_item: "5.4.04", descricao: "Limitador de momento de carga (LMC)" },
  { secao: "5.4", numero_item: "5.4.05", descricao: "Válvula de retenção (anti-queda)" },
  { secao: "5.4", numero_item: "5.4.06", descricao: "Gráfico/tabela de cargas (legível, fixado)" },
  { secao: "5.4", numero_item: "5.4.07", descricao: "Plaqueta de identificação do fabricante" },
  { secao: "5.5", numero_item: "5.5.01", descricao: "Sinalização visual (faixas refletivas)" },
  { secao: "5.5", numero_item: "5.5.02", descricao: "Alarme sonoro de operação" },
  { secao: "5.5", numero_item: "5.5.03", descricao: "Dispositivo anti-two block" },
  { secao: "5.5", numero_item: "5.5.04", descricao: "Proteção do operador contra esmagamento" },
  { secao: "5.5", numero_item: "5.5.05", descricao: "Aterramento elétrico" },
  { secao: "5.5", numero_item: "5.5.06", descricao: "Horímetro (funcionamento)" },
  { secao: "5.5", numero_item: "5.5.07", descricao: "Manual de operação disponível" },
  { secao: "5.5", numero_item: "5.5.08", descricao: "Condições gerais de segurança para operação" },
];

// GET /api/laudos
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status") as "rascunho" | "finalizado" | null;

  const conditions = [eq(laudos.user_id, userId)];
  if (status) conditions.push(eq(laudos.status, status));

  const resultado = await db
    .select()
    .from(laudos)
    .where(and(...conditions))
    .orderBy(desc(laudos.updated_at));

  // Para cada laudo, busca dados resumidos das relações
  const laudosComRelacoes = await Promise.all(
    resultado.map(async (l: typeof resultado[number]) => {
      const [prop] = await db.select({ razao_social: proprietarios.razao_social, cnpj: proprietarios.cnpj }).from(proprietarios).where(eq(proprietarios.laudo_id, l.id)).limit(1);
      const [veic] = await db.select({ placa: veiculos.placa, marca_modelo: veiculos.marca_modelo }).from(veiculos).where(eq(veiculos.laudo_id, l.id)).limit(1);
      const [impl] = await db.select({ fabricante: implementos.fabricante, modelo: implementos.modelo }).from(implementos).where(eq(implementos.laudo_id, l.id)).limit(1);
      return { ...l, proprietarios: prop || null, veiculos: veic || null, implementos: impl || null };
    })
  );

  return NextResponse.json(laudosComRelacoes);
}

// POST /api/laudos
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [laudo] = await db
    .insert(laudos)
    .values({ user_id: userId })
    .returning();

  // Cria registros vazios das seções
  await Promise.all([
    db.insert(proprietarios).values({ laudo_id: laudo.id }),
    db.insert(implementos).values({ laudo_id: laudo.id }),
    db.insert(veiculos).values({ laudo_id: laudo.id }),
    db.insert(caracteristicas_veiculo).values({ laudo_id: laudo.id }),
  ]);

  // Insere os 36 itens de inspeção
  await db.insert(itens_inspecao).values(
    ITENS_SEED.map((item) => ({ ...item, laudo_id: laudo.id }))
  );

  return NextResponse.json(laudo, { status: 201 });
}

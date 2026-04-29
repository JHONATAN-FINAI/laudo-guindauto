import { db } from "@/lib/db";
import {
  proprietarios,
  implementos,
  veiculos,
  caracteristicas_veiculo,
  itens_inspecao,
} from "@/lib/db/schema";

/** 36 itens de inspeção conforme NBR 14768 */
export const ITENS_INSPECAO_SEED = [
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
] as const;

/**
 * Cria todas as tabelas filhas de um laudo recém-criado.
 * Centralizado aqui para evitar duplicação entre routes.
 */
export async function criarEstruturaLaudo(laudoId: string) {
  await Promise.all([
    db.insert(proprietarios).values({ laudo_id: laudoId }),
    db.insert(implementos).values({ laudo_id: laudoId }),
    db.insert(veiculos).values({ laudo_id: laudoId }),
    db.insert(caracteristicas_veiculo).values({ laudo_id: laudoId }),
    db.insert(itens_inspecao).values(
      ITENS_INSPECAO_SEED.map((item) => ({ ...item, laudo_id: laudoId }))
    ),
  ]);
}

import { db } from "@/lib/db";
import {
  proprietarios,
  implementos,
  veiculos,
  caracteristicas_veiculo,
  itens_inspecao,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// 30 itens de inspeção conforme laudo padrão
// Baseado na ABNT NBR 14768:2015, NBR 16092:2012, NR-11 e NR-12
// ---------------------------------------------------------------------------
export const ITENS_INSPECAO_SEED = [
  // 5.1 SISTEMA DE SINALIZAÇÃO
  { secao: "5.1", numero_item: "5.1.1", descricao: "Lanternas indicadoras de direção" },
  { secao: "5.1", numero_item: "5.1.2", descricao: "Lanternas de posição" },
  { secao: "5.1", numero_item: "5.1.3", descricao: "Lanternas de freio" },
  { secao: "5.1", numero_item: "5.1.4", descricao: "Lanterna de freio elevada" },
  { secao: "5.1", numero_item: "5.1.5", descricao: "Lanternas de marcha-ré" },
  { secao: "5.1", numero_item: "5.1.6", descricao: "Lanternas delimitadoras e laterais" },
  { secao: "5.1", numero_item: "5.1.7", descricao: "Pisca-alerta" },
  { secao: "5.1", numero_item: "5.1.8", descricao: "Refletores" },
  { secao: "5.1", numero_item: "5.1.9", descricao: "Faixas refletivas" },

  // 5.2 SISTEMA DE ILUMINAÇÃO
  { secao: "5.2", numero_item: "5.2.1", descricao: "Faróis principais" },
  { secao: "5.2", numero_item: "5.2.2", descricao: "Faróis de neblina" },
  { secao: "5.2", numero_item: "5.2.3", descricao: "Faróis de longo alcance" },
  { secao: "5.2", numero_item: "5.2.4", descricao: "Luzes do painel" },

  // 5.3 SISTEMA DE FREIO
  { secao: "5.3", numero_item: "5.3.1", descricao: "Comandos" },
  { secao: "5.3", numero_item: "5.3.2", descricao: "Servo-freio/hidrovácuo" },
  { secao: "5.3", numero_item: "5.3.3", descricao: "Reservatório do fluído de freio" },
  { secao: "5.3", numero_item: "5.3.4", descricao: "Reservatório de ar/vácuo" },
  { secao: "5.3", numero_item: "5.3.5", descricao: "Circuitos de freio/tubulações/conexões" },
  { secao: "5.3", numero_item: "5.3.6", descricao: "Freio estacionário" },

  // 5.4 PNEUS E RODAS
  { secao: "5.4", numero_item: "5.4.1", descricao: "Desgaste da banda de rodagem" },
  { secao: "5.4", numero_item: "5.4.2", descricao: "Tamanho e tipo dos pneus" },
  { secao: "5.4", numero_item: "5.4.3", descricao: "Simetria dos pneus e rodas" },
  { secao: "5.4", numero_item: "5.4.4", descricao: "Existência de hérnias ou bolhas" },
  { secao: "5.4", numero_item: "5.4.5", descricao: "Existência de cortes ou quebras com exposição dos cordonéis" },
  { secao: "5.4", numero_item: "5.4.6", descricao: "Existência de separação da banda de rodagem" },

  // 5.5 INSPEÇÃO DO IMPLEMENTO (EQUIPAMENTO GUINDAUTO)
  { secao: "5.5", numero_item: "5.5.1",  descricao: "Estrutura principal do guindauto (braço, lanças, base, coluna)" },
  { secao: "5.5", numero_item: "5.5.2",  descricao: "Fixação do equipamento ao chassi do caminhão" },
  { secao: "5.5", numero_item: "5.5.3",  descricao: "Sistema hidráulico (mangueiras, cilindros, conexões, reservatórios)" },
  { secao: "5.5", numero_item: "5.5.4",  descricao: "Válvulas de segurança, válvula de retenção e limitadores de carga" },
  { secao: "5.5", numero_item: "5.5.5",  descricao: "Dispositivos de comando e parada de emergência (NR-12)" },
  { secao: "5.5", numero_item: "5.5.6",  descricao: "Estabilizadores (sapatas, braços e suportes)" },
  { secao: "5.5", numero_item: "5.5.7",  descricao: "Moitão, gancho, trava de segurança e cabos" },
  { secao: "5.5", numero_item: "5.5.8",  descricao: "Tabela de carga legível e afixada no equipamento" },
  { secao: "5.5", numero_item: "5.5.9",  descricao: "Funcionamento geral dos movimentos (elevação, giro, extensão)" },
  { secao: "5.5", numero_item: "5.5.10", descricao: "Sistema elétrico e dispositivos de aviso/sinalização" },
  { secao: "5.5", numero_item: "5.5.11", descricao: "Teste de carga (opcional – conforme condição de uso)" },
] as const;

export const NOMES_SECOES: Record<string, string> = {
  "5.1": "Sistema de Sinalização",
  "5.2": "Sistema de Iluminação",
  "5.3": "Sistema de Freio",
  "5.4": "Pneus e Rodas",
  "5.5": "Inspeção do Implemento (Equipamento Guindauto)",
};

/**
 * Cria todas as tabelas filhas de um laudo recém-criado.
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

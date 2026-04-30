import { db } from "@/lib/db";
import { proprietarios, implementos, veiculos, caracteristicas_veiculo, itens_inspecao } from "@/lib/db/schema";
import { ITENS_INSPECAO_CONFIG, NOMES_SECOES } from "./constants";

// Re-exporta para quem precisar do servidor
export { NOMES_SECOES, ITENS_INSPECAO_CONFIG };

export async function criarEstruturaLaudo(laudoId: string) {
  await Promise.all([
    db.insert(proprietarios).values({ laudo_id: laudoId }),
    db.insert(implementos).values({ laudo_id: laudoId }),
    db.insert(veiculos).values({ laudo_id: laudoId }),
    db.insert(caracteristicas_veiculo).values({ laudo_id: laudoId }),
    db.insert(itens_inspecao).values(
      ITENS_INSPECAO_CONFIG.map((item) => ({ ...item, laudo_id: laudoId }))
    ),
  ]);
}

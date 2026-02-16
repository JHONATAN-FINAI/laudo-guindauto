import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { textos_padrao } from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const TEXTOS = [
  {
    chave: "introducao",
    titulo: "Introdução",
    conteudo:
      "O presente Relatório de Inspeção tem por objetivo avaliar as condições técnicas e de segurança do equipamento de guindar tipo guindauto (guindaste articulado veicular), conforme normas vigentes NBR 14768, NBR 11900, NR-11, NR-12 e NR-13.",
  },
  {
    chave: "fundamentacao",
    titulo: "Fundamentação Legal",
    conteudo:
      "Este relatório atende ao disposto na NR-11 (Transporte, Movimentação, Armazenagem e Manuseio de Materiais), NR-12 (Segurança no Trabalho em Máquinas e Equipamentos) e NBR 14768 (Guindastes Articulados Hidráulicos).",
  },
  {
    chave: "metodologia",
    titulo: "Metodologia de Inspeção",
    conteudo:
      "A inspeção foi realizada por meio de análise visual, dimensional e funcional dos componentes estruturais, hidráulicos, de segurança e operacionais do equipamento, conforme check-list baseado nas normas técnicas aplicáveis.",
  },
  {
    chave: "parecer_apto",
    titulo: "Parecer Técnico - APTO",
    conteudo:
      "Com base na inspeção realizada, o equipamento encontra-se em condições satisfatórias de operação, estando APTO para uso dentro dos limites de carga especificados pelo fabricante. Recomenda-se manutenção preventiva conforme manual do fabricante e nova inspeção em 12 (doze) meses.",
  },
  {
    chave: "parecer_nao_apto",
    titulo: "Parecer Técnico - NÃO APTO",
    conteudo:
      "Com base na inspeção realizada, o equipamento apresenta não conformidades que comprometem a segurança operacional, estando NÃO APTO para uso. O equipamento deverá permanecer fora de operação até que todas as não conformidades sejam corrigidas e nova inspeção seja realizada.",
  },
  {
    chave: "responsabilidade",
    titulo: "Responsabilidade Técnica",
    conteudo:
      "O presente relatório é de responsabilidade exclusiva do engenheiro signatário, devidamente habilitado pelo CREA, conforme ART específica vinculada a este documento.",
  },
];

async function seed() {
  console.log("Inserindo textos padrão...");

  for (const texto of TEXTOS) {
    await db
      .insert(textos_padrao)
      .values(texto)
      .onConflictDoNothing();
  }

  console.log("Seed concluído!");
}

seed().catch(console.error);

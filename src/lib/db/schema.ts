import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const statusLaudoEnum = pgEnum("status_laudo", ["rascunho", "finalizado"]);
export const conclusaoLaudoEnum = pgEnum("conclusao_laudo", ["apto", "nao_apto"]);
export const situacaoItemEnum = pgEnum("situacao_item", ["aprovado", "reprovado", "nao_se_aplica"]);
export const tipoFotoEnum = pgEnum("tipo_foto", [
  "capa", "placa", "guindaste", "alavancas", "plaqueta",
  "grafico_cargas", "mangueiras", "estabilizadores", "horimetro",
  "extra_1", "extra_2", "extra_3", "extra_4", "extra_5",
]);

// Tabela de usuários (substitui Supabase Auth + tabela users)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  senha_hash: text("senha_hash").notNull(),
  nome: text("nome").notNull(),
  crea_numero: text("crea_numero"),
  crea_estado: text("crea_estado"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Laudos
export const laudos = pgTable("laudos", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  numero_inspecao: text("numero_inspecao"),
  status: statusLaudoEnum("status").default("rascunho").notNull(),
  data_inspecao: text("data_inspecao"),
  data_validade: text("data_validade"),
  conclusao: conclusaoLaudoEnum("conclusao"),
  art_numero: text("art_numero"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Proprietários
export const proprietarios = pgTable("proprietarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  laudo_id: uuid("laudo_id").notNull().references(() => laudos.id, { onDelete: "cascade" }),
  cnpj: text("cnpj"),
  razao_social: text("razao_social"),
  endereco: text("endereco"),
  email: text("email"),
  telefone: text("telefone"),
});

// Implementos
export const implementos = pgTable("implementos", {
  id: uuid("id").defaultRandom().primaryKey(),
  laudo_id: uuid("laudo_id").notNull().references(() => laudos.id, { onDelete: "cascade" }),
  fabricante: text("fabricante"),
  modelo: text("modelo"),
  numero_serie: text("numero_serie"),
  ano_fabricacao: text("ano_fabricacao"),
  peso: text("peso"),
  pressao_trabalho: text("pressao_trabalho"),
  capacidade_carga: text("capacidade_carga"),
  alcance_horizontal: text("alcance_horizontal"),
  alcance_vertical: text("alcance_vertical"),
  angulo_giro: text("angulo_giro"),
  horimetro: text("horimetro"),
});

// Veículos
export const veiculos = pgTable("veiculos", {
  id: uuid("id").defaultRandom().primaryKey(),
  laudo_id: uuid("laudo_id").notNull().references(() => laudos.id, { onDelete: "cascade" }),
  tipo: text("tipo"),
  placa: text("placa"),
  ano_modelo: text("ano_modelo"),
  chassi: text("chassi"),
  renavan: text("renavan"),
  marca_modelo: text("marca_modelo"),
  num_eixos: text("num_eixos"),
  pbtc: text("pbtc"),
});

// Características do veículo
export const caracteristicas_veiculo = pgTable("caracteristicas_veiculo", {
  id: uuid("id").defaultRandom().primaryKey(),
  laudo_id: uuid("laudo_id").notNull().references(() => laudos.id, { onDelete: "cascade" }),
  distancia_entre_eixos: text("distancia_entre_eixos"),
  comprimento_total: text("comprimento_total"),
  comprimento_carroceria: text("comprimento_carroceria"),
  largura: text("largura"),
  altura: text("altura"),
  qtd_eixos_rodas: text("qtd_eixos_rodas"),
  eixos_motrizes: text("eixos_motrizes"),
  pbtc: text("pbtc"),
  cmt: text("cmt"),
});

// Itens de inspeção
export const itens_inspecao = pgTable("itens_inspecao", {
  id: uuid("id").defaultRandom().primaryKey(),
  laudo_id: uuid("laudo_id").notNull().references(() => laudos.id, { onDelete: "cascade" }),
  secao: text("secao").notNull(),
  numero_item: text("numero_item").notNull(),
  descricao: text("descricao").notNull(),
  situacao: situacaoItemEnum("situacao"),
  observacoes: text("observacoes"),
  foto_url: text("foto_url"),
});

// Fotos do laudo
export const fotos_laudo = pgTable("fotos_laudo", {
  id: uuid("id").defaultRandom().primaryKey(),
  laudo_id: uuid("laudo_id").notNull().references(() => laudos.id, { onDelete: "cascade" }),
  tipo: tipoFotoEnum("tipo").notNull(),
  storage_url: text("storage_url").notNull(), // URL do Vercel Blob
  legenda: text("legenda"),
  ordem: integer("ordem").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Modelos de implemento (para autocomplete futuro)
export const modelos_implemento = pgTable("modelos_implemento", {
  id: uuid("id").defaultRandom().primaryKey(),
  fabricante: text("fabricante").notNull(),
  modelo: text("modelo").notNull(),
  peso: text("peso"),
  pressao_trabalho: text("pressao_trabalho"),
  capacidade_carga: text("capacidade_carga"),
  alcance_horizontal: text("alcance_horizontal"),
  alcance_vertical: text("alcance_vertical"),
  angulo_giro: text("angulo_giro"),
});

// Modelos de veículo (para autocomplete futuro)
export const modelos_veiculo = pgTable("modelos_veiculo", {
  id: uuid("id").defaultRandom().primaryKey(),
  marca: text("marca").notNull(),
  modelo: text("modelo").notNull(),
  tipo: text("tipo"),
});

// Textos padrão (para o template do PDF)
export const textos_padrao = pgTable("textos_padrao", {
  id: uuid("id").defaultRandom().primaryKey(),
  chave: text("chave").notNull().unique(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

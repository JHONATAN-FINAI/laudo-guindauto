// Tipos inferidos do schema Drizzle

export type StatusLaudo = "rascunho" | "finalizado";
export type ConclusaoLaudo = "apto" | "nao_apto";
export type SituacaoItem = "aprovado" | "reprovado" | "nao_se_aplica";

export type TipoFoto =
  // Principais (1–13)
  | "capa"
  | "placa"
  | "guindaste"
  | "alavancas"
  | "botao_emergencia"
  | "controle_remoto"
  | "plaqueta"
  | "tabela_cargas"
  | "grafico_cargas"
  | "mangueiras"
  | "valvulas"
  | "estabilizadores"
  | "horimetro"
  // Ângulos (14–17)
  | "lateral_dianteira_esq"
  | "lateral_dianteira_dir"
  | "lateral_traseira_esq"
  | "lateral_traseira_dir"
  // Extras (18–20)
  | "extra_1"
  | "extra_2"
  | "extra_3";

export interface User {
  id: string;
  email: string;
  nome: string;
  crea_numero: string | null;
  crea_estado: string | null;
  created_at: string;
}

export interface Engenheiro {
  id: string;
  user_id: string;
  nome: string;
  crea_numero: string;
  crea_estado: string;
  especialidade: string;
  ativo: string;
  created_at: string;
}

export interface Laudo {
  id: string;
  user_id: string;
  numero_inspecao: string | null;
  status: StatusLaudo;
  data_inspecao: string | null;
  data_validade: string | null;
  conclusao: ConclusaoLaudo | null;
  art_numero: string | null;
  engenheiro_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Proprietario {
  id: string;
  laudo_id: string;
  cnpj: string | null;
  razao_social: string | null;
  endereco: string | null;
  email: string | null;
  telefone: string | null;
}

export interface Implemento {
  id: string;
  laudo_id: string;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  ano_fabricacao: string | null;
  peso: string | null;
  pressao_trabalho: string | null;
  capacidade_carga: string | null;
  alcance_horizontal: string | null;
  alcance_vertical: string | null;
  angulo_giro: string | null;
  horimetro: string | null;
}

export interface Veiculo {
  id: string;
  laudo_id: string;
  tipo: string | null;
  placa: string | null;
  ano_modelo: string | null;
  chassi: string | null;
  renavan: string | null;
  marca_modelo: string | null;
  num_eixos: string | null;
  pbtc: string | null;
  hodometro: string | null;
}

export interface CaracteristicasVeiculo {
  id: string;
  laudo_id: string;
  distancia_entre_eixos: string | null;
  comprimento_total: string | null;
  comprimento_carroceria: string | null;
  largura: string | null;
  altura: string | null;
  qtd_eixos_rodas: string | null;
  eixos_motrizes: string | null;
  pbtc: string | null;
  cmt: string | null;
}

export interface ItemInspecao {
  id: string;
  laudo_id: string;
  secao: string;
  numero_item: string;
  descricao: string;
  situacao: SituacaoItem | null;
  observacoes: string | null;
  foto_url: string | null;
}

export interface FotoLaudo {
  id: string;
  laudo_id: string;
  tipo: TipoFoto;
  storage_url: string;
  legenda: string | null;
  ordem: number;
  created_at: string;
}

export interface ModeloImplemento {
  id: string;
  fabricante: string;
  modelo: string;
  peso: string | null;
  pressao_trabalho: string | null;
  capacidade_carga: string | null;
  alcance_horizontal: string | null;
  alcance_vertical: string | null;
  angulo_giro: string | null;
}

export interface ModeloVeiculo {
  id: string;
  marca: string;
  modelo: string;
  tipo: string | null;
}

export interface TextoPadrao {
  id: string;
  chave: string;
  titulo: string;
  conteudo: string;
  updated_at: string;
}

// Laudo com relações (para o wizard)
export interface LaudoCompleto extends Laudo {
  proprietario: Proprietario | null;
  implemento: Implemento | null;
  veiculo: Veiculo | null;
  caracteristicas: CaracteristicasVeiculo | null;
  itens_inspecao: ItemInspecao[];
  fotos: FotoLaudo[];
  user: Pick<User, "nome" | "crea_numero" | "crea_estado">;
  engenheiro: Engenheiro | null;
}

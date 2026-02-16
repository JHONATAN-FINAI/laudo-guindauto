import type { DadosPDF } from "./generate";
import * as fs from "fs";
import * as path from "path";

// Helper: formata data brasileira
function formatarData(data: string | null | undefined): string {
  if (!data) return "___/___/______";
  const d = new Date(data + "T12:00:00");
  return d.toLocaleDateString("pt-BR");
}

// Helper: formata data por extenso
function formatarDataExtenso(data: string | null | undefined): string {
  if (!data) return "________, ___ de __________ de ______";
  const d = new Date(data + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Helper: checkbox visual
function checkbox(marcado: boolean): string {
  return marcado ? "(X)" : "( )";
}

// Helper: situação do item como checkboxes
function situacaoCheckboxes(situacao: string | null): string {
  return `
    <span class="situacao">
      ${checkbox(situacao === "aprovado")} Aprovado
      ${checkbox(situacao === "reprovado")} Reprovado
      ${checkbox(situacao === "nao_se_aplica")} N/A
    </span>
  `;
}

// Helper: substitui placeholders nos textos padrão
function substituirPlaceholders(texto: string, dados: DadosPDF): string {
  return texto
    .replace(/\{\{razao_social\}\}/g, dados.proprietario?.razao_social || "___")
    .replace(/\{\{cnpj\}\}/g, dados.proprietario?.cnpj || "___")
    .replace(/\{\{endereco\}\}/g, dados.proprietario?.endereco || "___")
    .replace(/\{\{modelo\}\}/g, dados.implemento?.modelo || "___")
    .replace(/\{\{fabricante\}\}/g, dados.implemento?.fabricante || "___")
    .replace(/\{\{placa\}\}/g, dados.veiculo?.placa || "___")
    .replace(/\{\{numero_inspecao\}\}/g, dados.laudo?.numero_inspecao || "___")
    .replace(/\{\{data_inspecao\}\}/g, formatarData(dados.laudo?.data_inspecao))
    .replace(/\{\{data_validade\}\}/g, formatarData(dados.laudo?.data_validade));
}

// Helper: converte URL de foto para base64 data URI (para Puppeteer renderizar fotos locais)
function fotoParaBase64(url: string): string {
  if (!url) return "";
  // Se já é data URI ou URL absoluta http/https, retorna direto
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // URL local relativa (ex: /uploads/abc.jpg) - converter para base64
  try {
    const localPath = path.join(process.cwd(), "public", url);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(localPath).replace(".", "").toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }
  } catch { /* ignore */ }
  return url;
}

// Agrupa itens por seção
function agruparPorSecao(itens: any[]): Record<string, any[]> {
  const grupos: Record<string, any[]> = {};
  for (const item of itens) {
    if (!grupos[item.secao]) grupos[item.secao] = [];
    grupos[item.secao].push(item);
  }
  return grupos;
}

const NOMES_SECOES: Record<string, string> = {
  "5.1": "Estrutura e Componentes Mecânicos",
  "5.2": "Sistema Hidráulico",
  "5.3": "Estabilizadores e Fixação",
  "5.4": "Acessórios de Carga e Içamento",
  "5.5": "Dispositivos de Segurança",
};

const LEGENDAS_FOTOS: Record<string, string> = {
  capa: "Imagem 1 - Vista geral do veículo",
  placa: "Imagem 2 - Placa do veículo",
  guindaste: "Imagem 3 - Guindaste",
  alavancas: "Imagem 4 - Alavancas de comando",
  plaqueta: "Imagem 5 - Plaqueta de identificação",
  grafico_cargas: "Imagem 6 - Gráfico de cargas",
  mangueiras: "Imagem 7 - Mangueiras hidráulicas",
  estabilizadores: "Imagem 8 - Estabilizadores",
  horimetro: "Imagem 9 - Horímetro",
};

// Helper: gera tabela de itens reprovados
function gerarTabelaReprovados(itens: any[]): string {
  const reprovados = itens.filter((i: any) => i.situacao === "reprovado");
  if (reprovados.length === 0) return "";
  const linhas = reprovados.map((item: any) =>
    '<tr><td>' + item.numero_item + '</td><td>' + item.descricao + '</td><td>' + (item.observacoes || "—") + '</td></tr>'
  ).join("");
  return '<h3 style="margin-top:5mm;">6.10. Itens com não conformidade identificados nesta inspeção</h3>' +
    '<table class="inspecao-table"><thead><tr>' +
    '<th style="width:12%">Item</th><th style="width:50%">Descrição</th><th style="width:38%">Observações</th>' +
    '</tr></thead><tbody>' + linhas + '</tbody></table>';
}

export function buildTemplate(dados: DadosPDF): string {
  const { laudo, proprietario, implemento, veiculo, caracteristicas, itens_inspecao, fotos, textos_padrao, user } = dados;

  const gruposItens = agruparPorSecao(itens_inspecao);

  // Foto de capa como base64
  const fotoCapa = fotos.find((f) => f.tipo === "capa");
  const fotoCapaUrl = fotoParaBase64(fotoCapa?.url || fotoCapa?.storage_url || "");

  // Fotos para o anexo (exceto capa)
  const fotosAnexo = fotos
    .filter((f) => f.tipo !== "capa")
    .sort((a: any, b: any) => a.ordem - b.ordem);

  // Extrair cidade do endereço do proprietário
  const endereco = proprietario?.endereco || "";
  // Tenta pegar "CIDADE/UF" do endereço
  const matchCidade = endereco.match(/,\s*([^,\/]+)\/([A-Z]{2})/);
  const localInspecao = matchCidade
    ? `${matchCidade[1].trim()} — ${matchCidade[2]}`
    : user.crea_estado ? `__________ — ${user.crea_estado}` : "__________, ___";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    font-size: 11pt;
    color: #222;
    line-height: 1.5;
  }

  .page-break { page-break-before: always; }

  /* ===== CAPA ===== */
  .capa {
    text-align: center;
    padding-top: 15mm;
  }
  .capa h1 {
    font-size: 15pt;
    font-weight: bold;
    line-height: 1.6;
    margin-bottom: 10mm;
    text-transform: uppercase;
  }
  .capa .numero-inspecao {
    font-size: 13pt;
    font-weight: bold;
    margin-bottom: 8mm;
  }
  .capa .foto-capa {
    max-width: 90%;
    max-height: 90mm;
    object-fit: contain;
    margin: 5mm auto;
    display: block;
  }
  .capa .info-rodape {
    margin-top: 10mm;
    font-size: 11pt;
  }
  .capa .info-rodape p {
    margin: 2mm 0;
  }

  /* ===== SEÇÕES ===== */
  h2 {
    font-size: 11pt;
    font-weight: bold;
    background: #2c3e50;
    color: white;
    padding: 2mm 4mm;
    margin: 5mm 0 3mm 0;
  }
  h3 {
    font-size: 10pt;
    font-weight: bold;
    border-bottom: 1px solid #ccc;
    padding-bottom: 1mm;
    margin: 4mm 0 2mm 0;
  }

  /* ===== TABELAS DE DADOS ===== */
  .dados-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2mm 0 4mm 0;
  }
  .dados-table td {
    padding: 1.5mm 3mm;
    border: 0.5pt solid #ccc;
    vertical-align: top;
  }
  .dados-table .label {
    font-weight: bold;
    background: #f5f5f5;
    width: 40%;
    font-size: 9pt;
  }
  .dados-table .valor {
    width: 60%;
  }

  /* ===== TABELAS DE INSPEÇÃO ===== */
  .inspecao-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2mm 0 4mm 0;
    font-size: 9pt;
  }
  .inspecao-table th {
    background: #34495e;
    color: white;
    padding: 2mm 3mm;
    text-align: left;
    font-size: 8pt;
    font-weight: bold;
  }
  .inspecao-table td {
    padding: 1.5mm 3mm;
    border: 0.5pt solid #ccc;
    vertical-align: top;
  }
  .inspecao-table tr:nth-child(even) td {
    background: #fafafa;
  }
  .situacao {
    font-size: 8pt;
    white-space: nowrap;
  }

  /* ===== TEXTO ===== */
  .texto-secao {
    text-align: justify;
    margin: 2mm 0;
    line-height: 1.6;
  }

  /* ===== CONCLUSÃO ===== */
  .conclusao-box {
    border: 1pt solid #333;
    padding: 4mm;
    margin: 4mm 0;
    text-align: center;
  }
  .conclusao-box .opcao {
    font-size: 11pt;
    font-weight: bold;
    margin: 2mm 0;
  }
  .conclusao-box .apto { color: #27ae60; }
  .conclusao-box .nao-apto { color: #c0392b; }

  /* ===== RESPONSÁVEL ===== */
  .assinatura-box {
    margin-top: 15mm;
    text-align: center;
  }
  .assinatura-box .linha {
    width: 60%;
    border-top: 1pt solid #333;
    margin: 0 auto;
    padding-top: 2mm;
  }

  /* ===== FOTOS ===== */
  .foto-container {
    text-align: center;
    margin: 5mm 0;
    page-break-inside: avoid;
  }
  .foto-container img {
    max-width: 90%;
    max-height: 110mm;
    object-fit: contain;
  }
  .foto-container .legenda {
    font-size: 9pt;
    font-style: italic;
    margin-top: 2mm;
    color: #555;
  }

  /* ===== FOTOS EM GRID (2 por linha) ===== */
  .fotos-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4mm;
    justify-content: center;
  }
  .fotos-grid .foto-container {
    width: 48%;
    page-break-inside: avoid;
  }
  .fotos-grid .foto-container img {
    max-height: 80mm;
  }

  /* ===== CHECKLIST PRÉ-OPERAÇÃO ===== */
  .checklist-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin: 3mm 0;
  }
  .checklist-table th, .checklist-table td {
    border: 0.5pt solid #999;
    padding: 1.5mm 2mm;
  }
  .checklist-table th {
    background: #ecf0f1;
    font-weight: bold;
    text-align: center;
  }
</style>
</head>
<body>

<!-- ==================== PÁGINA 1: CAPA ==================== -->
<div class="capa">
  <h1>Inspeção Periódica para Guindaste Articulado Hidráulico<br>
  Instalado sobre Chassi Veicular — Caminhão Munk (Guindauto)</h1>

  <div class="numero-inspecao">
    Inspeção Nº ${laudo.numero_inspecao || "___/____"}
  </div>

  ${fotoCapaUrl ? `<img src="${fotoCapaUrl}" class="foto-capa" />` : ""}

  <div class="info-rodape">
    <p><strong>Responsável Técnico:</strong> ${user.nome}</p>
    <p><strong>CREA:</strong> ${user.crea_numero || "___"}/${user.crea_estado || "__"}</p>
    <p><strong>ART:</strong> ${laudo.art_numero || "___"}</p>
    <p><strong>Data da Inspeção:</strong> ${formatarData(laudo.data_inspecao)}</p>
    <p><strong>Validade:</strong> ${formatarData(laudo.data_validade)}</p>
  </div>
</div>

<!-- ==================== PÁGINA 2: TERMO DE ABERTURA ==================== -->
<div class="page-break"></div>
<h2>Termo de Abertura</h2>

<p class="texto-secao" style="margin-top:5mm; text-indent: 2em;">
  O presente Relatório de Inspeção Periódica tem por objetivo avaliar as condições técnicas e de segurança
  do guindaste articulado hidráulico (guindauto) instalado sobre chassi veicular, de propriedade da empresa
  <strong>${proprietario?.razao_social || "___"}</strong>, inscrita no CNPJ nº <strong>${proprietario?.cnpj || "___"}</strong>,
  instalado no veículo de placa <strong>${veiculo?.placa || "___"}</strong>, marca/modelo
  <strong>${veiculo?.marca_modelo || "___"}</strong>, implemento fabricado por
  <strong>${implemento?.fabricante || "___"}</strong>, modelo <strong>${implemento?.modelo || "___"}</strong>,
  número de série <strong>${implemento?.numero_serie || "___"}</strong>.
</p>

<p class="texto-secao" style="margin-top:4mm; text-indent: 2em;">
  A inspeção foi realizada em conformidade com as seguintes normas regulamentadoras e normas técnicas:
  NR-11 (Transporte, Movimentação, Armazenagem e Manuseio de Materiais),
  NR-12 (Segurança no Trabalho em Máquinas e Equipamentos),
  ABNT NBR 14768:2015 (Guindastes Articulados Hidráulicos),
  ABNT NBR 16092:2012 (Dispositivos de Movimentação e Elevação de Cargas) e
  Resolução CONTRAN 316/2009 (Requisitos de Segurança Veicular).
</p>

<p class="texto-secao" style="margin-top:4mm; text-indent: 2em;">
  A metodologia empregada consistiu em análise visual, dimensional e funcional dos componentes estruturais,
  hidráulicos, de segurança e operacionais do equipamento, por meio de checklist técnico baseado nas normas
  supracitadas, com registro fotográfico das condições encontradas.
</p>

<p class="texto-secao" style="margin-top:4mm; text-indent: 2em;">
  A inspeção foi conduzida por profissional habilitado, devidamente registrado no Conselho Regional de
  Engenharia e Agronomia (CREA), com Anotação de Responsabilidade Técnica (ART) vinculada a este documento,
  assumindo inteira responsabilidade técnica pelos dados e conclusões aqui apresentados.
</p>

<p style="text-align: right; margin-top: 15mm; font-size: 11pt;">
  ${localInspecao}, ${formatarDataExtenso(laudo.data_inspecao)}.
</p>

<div class="assinatura-box" style="margin-top:20mm;">
  <p style="text-align:center;"><strong>${user.nome}</strong></p>
  <p style="text-align:center;">CREA ${user.crea_numero || "___"}/${user.crea_estado || "__"}</p>
  <p style="text-align:center;">Engenheiro Mecânico — Responsável Técnico</p>
</div>

<div class="assinatura-box" style="margin-top:15mm;">
  <p style="text-align:center;"><strong>${proprietario?.razao_social || "___"}</strong></p>
  <p style="text-align:center;">CNPJ: ${proprietario?.cnpj || "___"}</p>
</div>

<!-- ==================== SEÇÃO 1: PROPRIETÁRIO ==================== -->
<div class="page-break"></div>
<h2>1. Dados do Proprietário</h2>
<table class="dados-table">
  <tr><td class="label">CNPJ</td><td class="valor">${proprietario?.cnpj || "—"}</td></tr>
  <tr><td class="label">Razão Social</td><td class="valor">${proprietario?.razao_social || "—"}</td></tr>
  <tr><td class="label">Endereço</td><td class="valor">${proprietario?.endereco || "—"}</td></tr>
  <tr><td class="label">E-mail</td><td class="valor">${proprietario?.email || "—"}</td></tr>
  ${proprietario?.telefone ? `<tr><td class="label">Telefone</td><td class="valor">${proprietario.telefone}</td></tr>` : ""}
</table>

<!-- ==================== SEÇÃO 2: IMPLEMENTO ==================== -->
<h2>2. Dados do Implemento</h2>
<table class="dados-table">
  ${implemento?.fabricante ? `<tr><td class="label">Fabricante</td><td class="valor">${implemento.fabricante}</td></tr>` : ""}
  ${implemento?.modelo ? `<tr><td class="label">Modelo</td><td class="valor">${implemento.modelo}</td></tr>` : ""}
  ${implemento?.numero_serie ? `<tr><td class="label">Número de Série</td><td class="valor">${implemento.numero_serie}</td></tr>` : ""}
  ${implemento?.ano_fabricacao ? `<tr><td class="label">Ano de Fabricação</td><td class="valor">${implemento.ano_fabricacao}</td></tr>` : ""}
  ${implemento?.peso ? `<tr><td class="label">Peso</td><td class="valor">${implemento.peso}</td></tr>` : ""}
  ${implemento?.pressao_trabalho ? `<tr><td class="label">Pressão Máx. Trabalho</td><td class="valor">${implemento.pressao_trabalho}</td></tr>` : ""}
  ${implemento?.capacidade_carga ? `<tr><td class="label">Capacidade de Carga</td><td class="valor">${implemento.capacidade_carga}</td></tr>` : ""}
  ${implemento?.alcance_horizontal ? `<tr><td class="label">Alcance Horizontal</td><td class="valor">${implemento.alcance_horizontal}</td></tr>` : ""}
  ${implemento?.alcance_vertical ? `<tr><td class="label">Alcance Vertical</td><td class="valor">${implemento.alcance_vertical}</td></tr>` : ""}
  ${implemento?.angulo_giro ? `<tr><td class="label">Ângulo de Giro</td><td class="valor">${implemento.angulo_giro}</td></tr>` : ""}
  ${implemento?.horimetro ? `<tr><td class="label">Horímetro</td><td class="valor">${implemento.horimetro}</td></tr>` : ""}
</table>

<!-- ==================== SEÇÃO 3: VEÍCULO ==================== -->
<h2>3. Dados da Base / Veículo</h2>
<table class="dados-table">
  ${veiculo?.tipo ? `<tr><td class="label">Tipo</td><td class="valor">${veiculo.tipo}</td></tr>` : ""}
  ${veiculo?.placa ? `<tr><td class="label">Placa</td><td class="valor">${veiculo.placa}</td></tr>` : ""}
  ${veiculo?.ano_modelo ? `<tr><td class="label">Ano/Modelo</td><td class="valor">${veiculo.ano_modelo}</td></tr>` : ""}
  ${veiculo?.marca_modelo ? `<tr><td class="label">Marca/Modelo</td><td class="valor">${veiculo.marca_modelo}</td></tr>` : ""}
  ${veiculo?.chassi ? `<tr><td class="label">Chassi</td><td class="valor">${veiculo.chassi}</td></tr>` : ""}
  ${veiculo?.renavan ? `<tr><td class="label">RENAVAN</td><td class="valor">${veiculo.renavan}</td></tr>` : ""}
  ${veiculo?.num_eixos ? `<tr><td class="label">Nº de Eixos</td><td class="valor">${veiculo.num_eixos}</td></tr>` : ""}
  ${veiculo?.pbtc ? `<tr><td class="label">PBTC</td><td class="valor">${veiculo.pbtc}</td></tr>` : ""}
</table>

<!-- ==================== SEÇÃO 4: CARACTERÍSTICAS ==================== -->
<h2>4. Características Atuais do Veículo</h2>
<table class="dados-table">
  ${caracteristicas?.distancia_entre_eixos ? `<tr><td class="label">Distância entre Eixos</td><td class="valor">${caracteristicas.distancia_entre_eixos}</td></tr>` : ""}
  ${caracteristicas?.comprimento_total ? `<tr><td class="label">Comprimento Total</td><td class="valor">${caracteristicas.comprimento_total}</td></tr>` : ""}
  ${caracteristicas?.comprimento_carroceria ? `<tr><td class="label">Comprimento da Carroceria</td><td class="valor">${caracteristicas.comprimento_carroceria}</td></tr>` : ""}
  ${caracteristicas?.largura ? `<tr><td class="label">Largura</td><td class="valor">${caracteristicas.largura}</td></tr>` : ""}
  ${caracteristicas?.altura ? `<tr><td class="label">Altura</td><td class="valor">${caracteristicas.altura}</td></tr>` : ""}
  ${caracteristicas?.qtd_eixos_rodas ? `<tr><td class="label">Qtd. Eixos / Rodas</td><td class="valor">${caracteristicas.qtd_eixos_rodas}</td></tr>` : ""}
  ${caracteristicas?.eixos_motrizes ? `<tr><td class="label">Eixos Motrizes</td><td class="valor">${caracteristicas.eixos_motrizes}</td></tr>` : ""}
  ${caracteristicas?.pbtc ? `<tr><td class="label">PBTC</td><td class="valor">${caracteristicas.pbtc}</td></tr>` : ""}
  ${caracteristicas?.cmt ? `<tr><td class="label">CMT</td><td class="valor">${caracteristicas.cmt}</td></tr>` : ""}
</table>

<!-- ==================== SEÇÃO 5: INSPEÇÕES ==================== -->
<div class="page-break"></div>
<h2>5. Inspeções Realizadas</h2>

${Object.entries(gruposItens)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(
    ([secao, itens]) => `
  <h3>${secao} — ${NOMES_SECOES[secao] || secao}</h3>
  <table class="inspecao-table">
    <thead>
      <tr>
        <th style="width:12%">Item</th>
        <th style="width:38%">Descrição</th>
        <th style="width:25%">Situação</th>
        <th style="width:25%">Observações</th>
      </tr>
    </thead>
    <tbody>
      ${itens
        .sort((a: any, b: any) => a.numero_item.localeCompare(b.numero_item))
        .map(
          (item: any) => `
        <tr>
          <td>${item.numero_item}</td>
          <td>${item.descricao}</td>
          <td>${situacaoCheckboxes(item.situacao)}</td>
          <td>${item.observacoes || "—"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
`
  )
  .join("")}

<!-- ==================== SEÇÃO 6: CONSIDERAÇÕES TÉCNICAS ==================== -->
<div class="page-break"></div>
<h2>6. Considerações Técnicas</h2>

<p class="texto-secao" style="margin-top:4mm;">
  <strong>6.1.</strong> É obrigatório a troca das mangueiras de alta pressão com no máximo 72 meses mesmo que suas condições visuais estejam normais. As mangueiras do presente implemento, objeto desta inspeção apresentam conservação qualificada como conforme, sem deteriorização devido a exposição solar. Consultar o manual do proprietário ou o responsável técnico para a manutenção.
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.2.</strong> Tipo de óleo: O óleo usado no sistema hidráulico deve possuir no mínimo as seguintes características: antioxidante, antiespumante, anticorrosivo e antidesgastante.
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.3.</strong> Em hipótese alguma o equipamento poderá ser utilizado com sinais de oxidação.
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.4.</strong> Atentar sempre para a carga, respeitando o gráfico de carga presente no manual do proprietário e as respectivas carga máxima.
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.5.</strong> Nunca operar o equipamento quando o conjunto de operação apresentar condições anormais de funcionamento, tais como: vazamentos, ruídos estranhos, etc...
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.6.</strong> Para segurança na operação e manutenção do implemento hidráulico instalado sobre veículo é obrigatório antes de qualquer operação com o equipamento, realizar as inspeções frequentes, aquelas que são observadas pelo próprio operador e ficaram registradas neste livro, fazendo parte da documentação obrigatória do equipamento.
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.7.</strong> Qualquer acidente, incidente, anormalidade ou manutenção realizada no equipamento, devem ser registradas neste livro, em caso grave, o responsável técnico deve que ser comunicado imediatamente.
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.8.</strong> As recomendações citadas acima devem ser cumpridas de imediato, caso contrário este relatório de inspeção e manutenção perderá seu efeito, e será necessária nova avaliação.
</p>

<p class="texto-secao" style="margin-top:3mm;">
  <strong>6.9.</strong> O equipamento deverá ser submetido à nova inspeção periódica sempre que:<br>
  a) for danificado.<br>
  b) for realizada qualquer alteração em seu corpo.<br>
  c) sofrer qualquer tipo de acidente.
</p>

<!-- Itens reprovados listados automaticamente -->
${gerarTabelaReprovados(itens_inspecao)}

<!-- ==================== SEÇÃO 7: CONCLUSÃO ==================== -->
<h2>7. Conclusão</h2>
<div class="conclusao-box">
  <p class="opcao ${laudo.conclusao === "apto" ? "apto" : ""}">
    ${checkbox(laudo.conclusao === "apto")} O equipamento <strong>ESTÁ APTO</strong> para operação
  </p>
  <p class="opcao ${laudo.conclusao === "nao_apto" ? "nao-apto" : ""}">
    ${checkbox(laudo.conclusao === "nao_apto")} O equipamento <strong>NÃO ESTÁ APTO</strong> para operação
  </p>
</div>
<p class="texto-secao">
  Declaramos que o equipamento foi inspecionado conforme as normas regulamentadoras vigentes (NR-11, NR-12),
  normas técnicas ABNT NBR 14768:2015 e ABNT NBR 16092:2012, e que ${
    laudo.conclusao === "apto"
      ? "atende aos requisitos mínimos de segurança para operação."
      : "apresenta não conformidades que impedem sua operação segura, devendo ser corrigidas antes de nova utilização."
  }
</p>

<!-- ==================== SEÇÃO 8: REFERÊNCIAS NORMATIVAS ==================== -->
<h2>8. Referências Normativas</h2>
<p class="texto-secao">
  NR-11 — Transporte, Movimentação, Armazenagem e Manuseio de Materiais<br>
  NR-12 — Segurança no Trabalho em Máquinas e Equipamentos<br>
  ABNT NBR 14768:2015 — Guindastes Articulados Hidráulicos<br>
  ABNT NBR 16092:2012 — Dispositivos de Movimentação e Elevação de Cargas<br>
  Resolução CONTRAN 316/2009 — Requisitos de Segurança Veicular
</p>

<!-- ==================== SEÇÃO 9: RESPONSÁVEL TÉCNICO ==================== -->
<h2>9. Identificação do Responsável Técnico</h2>
<table class="dados-table">
  <tr><td class="label">Nome</td><td class="valor">${user.nome}</td></tr>
  <tr><td class="label">CREA</td><td class="valor">${user.crea_numero || "___"}/${user.crea_estado || "__"}</td></tr>
  <tr><td class="label">ART</td><td class="valor">${laudo.art_numero || "___"}</td></tr>
  <tr><td class="label">Data da Inspeção</td><td class="valor">${formatarData(laudo.data_inspecao)}</td></tr>
  <tr><td class="label">Validade</td><td class="valor">${formatarData(laudo.data_validade)}</td></tr>
</table>

<div class="assinatura-box">
  <p style="text-align:center;"><strong>${user.nome}</strong></p>
  <p style="text-align:center;">CREA ${user.crea_numero || "___"}/${user.crea_estado || "__"} — ART ${laudo.art_numero || "___"}</p>
  <p style="text-align:center;">Responsável Técnico</p>
</div>

<!-- ==================== ANEXO 01: RELATÓRIO FOTOGRÁFICO ==================== -->
${
  fotosAnexo.length > 0
    ? `
<div class="page-break"></div>
<h2>Anexo 01 — Relatório Fotográfico</h2>
<div class="fotos-grid">
${fotosAnexo
  .map((foto: any) => {
    const url = fotoParaBase64(foto.url || foto.storage_url || "");
    const legenda = foto.legenda || LEGENDAS_FOTOS[foto.tipo] || "Foto: " + foto.tipo;
    if (!url) return `<div class="foto-container"><p class="legenda">${legenda} (foto indisponível)</p></div>`;
    return `
    <div class="foto-container">
      <img src="${url}" />
      <p class="legenda">${legenda}</p>
    </div>
    `;
  })
  .join("")}
</div>
`
    : ""
}

<!-- ==================== ANEXO 02: CHECKLIST PRÉ-OPERAÇÃO ==================== -->
<div class="page-break"></div>
<h2>Anexo 02 — Checklist de Inspeção Pré-Operação Frequente</h2>
<p class="texto-secao" style="margin-bottom:4mm;">
  Este checklist deve ser preenchido pelo operador antes de cada utilização do equipamento.
  Recomenda-se manter 5 cópias para controle periódico.
</p>

${Array.from({ length: 5 })
  .map(
    (_, idx) => `
  ${idx > 0 ? '<div class="page-break"></div>' : ""}
  <h3>Checklist Pré-Operação — Folha ${idx + 1}/5</h3>
  <table class="dados-table" style="margin-bottom:3mm;">
    <tr><td class="label" style="width:25%">Data:</td><td class="valor">___/___/______</td>
        <td class="label" style="width:25%">Operador:</td><td class="valor">_______________</td></tr>
    <tr><td class="label">Placa:</td><td class="valor">${veiculo?.placa || "___"}</td>
        <td class="label">Horímetro:</td><td class="valor">_______________</td></tr>
  </table>
  <table class="checklist-table">
    <thead>
      <tr>
        <th style="width:5%">Nº</th>
        <th style="width:55%">Item de Verificação</th>
        <th style="width:8%">OK</th>
        <th style="width:8%">NOK</th>
        <th style="width:8%">N/A</th>
        <th style="width:16%">Obs.</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Nível de óleo hidráulico</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>2</td><td>Vazamentos em mangueiras e conexões</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>3</td><td>Estado dos cabos de aço</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>4</td><td>Funcionamento da parada de emergência</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>5</td><td>Estabilizadores (patolas) — estado e funcionamento</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>6</td><td>Gancho e trava de segurança</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>7</td><td>Movimentos do guindaste (elevar, girar, estender)</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>8</td><td>Tabela / gráfico de carga visível</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>9</td><td>Sinalização e luzes de operação</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>10</td><td>Condições gerais — trincas, corrosão, deformações</td><td></td><td></td><td></td><td></td></tr>
    </tbody>
  </table>
  <div style="margin-top:5mm;">
    <p style="font-size:8pt;"><strong>Observações:</strong> _______________________________________________</p>
    <p style="font-size:8pt; margin-top:8mm;"><strong>Assinatura do Operador:</strong> _________________________ <strong>Data:</strong> ___/___/___</p>
  </div>
`
  )
  .join("")}

</body>
</html>`;
}

import type { DadosPDF } from "./generate";
import { NOMES_SECOES } from "@/lib/laudos/constants";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Ordem canônica das fotos — espelha EtapaFotos.tsx
// ---------------------------------------------------------------------------
const ORDEM_FOTOS: { tipo: string; label: string }[] = [
  { tipo: "capa",                  label: "Vista geral do veículo (capa)" },
  { tipo: "placa",                 label: "Placa do veículo" },
  { tipo: "guindaste",             label: "Equipamento guindauto" },
  { tipo: "alavancas",             label: "Alavancas de acionamento e operação" },
  { tipo: "botao_emergencia",      label: "Botão de emergência" },
  { tipo: "controle_remoto",       label: "Controle remoto" },
  { tipo: "plaqueta",              label: "Plaqueta do equipamento guindauto" },
  { tipo: "tabela_cargas",         label: "Tabela de cargas" },
  { tipo: "grafico_cargas",        label: "Gráfico de cargas" },
  { tipo: "mangueiras",            label: "Mangueiras hidráulicas" },
  { tipo: "valvulas",              label: "Válvulas" },
  { tipo: "estabilizadores",       label: "Estabilizadores (patolas)" },
  { tipo: "horimetro",             label: "Horímetro" },
  { tipo: "lateral_dianteira_esq", label: "Lateral dianteira 45° (esq.)" },
  { tipo: "lateral_dianteira_dir", label: "Lateral dianteira 45° (dir.)" },
  { tipo: "lateral_traseira_esq",  label: "Lateral traseira 45° (esq.)" },
  { tipo: "lateral_traseira_dir",  label: "Lateral traseira 45° (dir.)" },
  { tipo: "extra_1",               label: "Foto extra" },
  { tipo: "extra_2",               label: "Foto extra" },
  { tipo: "extra_3",               label: "Foto extra" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatarData(data: string | null | undefined): string {
  if (!data) return "___/___/______";
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

function formatarDataExtenso(data: string | null | undefined): string {
  if (!data) return "________, ___ de __________ de ______";
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}


function formatarNumeroLaudo(numero: string | null | undefined): string {
  if (!numero) return "___/____";
  // Se já está no formato NNNN/AAAA, retorna como está
  // Se está em AAAA/NNNN (ex: 2026/0001), inverte para 0001/2026
  const partes = numero.split("/");
  if (partes.length === 2 && partes[0].length === 4 && parseInt(partes[0]) > 1000) {
    return `${partes[1]}/${partes[0]}`;
  }
  return numero;
}

function cb(marcado: boolean): string {
  return marcado ? `<span style="font-weight:bold;">(x)</span>` : `<span style="color:#999;">( )</span>`;
}

function situacaoCheckboxes(situacao: string | null): string {
  return `
    <div style="font-size:8.5pt; line-height:1.8;">
      ${cb(situacao === "aprovado")} Aprovado<br>
      ${cb(situacao === "reprovado")} Reprovado<br>
      ${cb(situacao === "nao_se_aplica")} Não se aplica
    </div>`;
}

function fotoParaBase64(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) return url;
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

function agruparPorSecao(itens: any[]): Record<string, any[]> {
  const grupos: Record<string, any[]> = {};
  for (const item of itens) {
    if (!grupos[item.secao]) grupos[item.secao] = [];
    grupos[item.secao].push(item);
  }
  return grupos;
}

function gerarTabelaReprovados(itens: any[]): string {
  const reprovados = itens.filter((i: any) => i.situacao === "reprovado");
  if (reprovados.length === 0) return "";
  const linhas = reprovados.map((item: any) =>
    `<tr>
      <td style="width:12%">${item.numero_item}</td>
      <td style="width:50%">${item.descricao}</td>
      <td style="width:38%">${item.observacoes || "—"}</td>
    </tr>`
  ).join("");
  return `
    <h3 style="margin-top:6mm; margin-bottom:2mm;">Itens com não conformidade identificados nesta inspeção</h3>
    <table class="inspecao-table">
      <thead><tr>
        <th style="width:12%">Item</th>
        <th style="width:50%">Descrição</th>
        <th style="width:38%">Observações</th>
      </tr></thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

// ---------------------------------------------------------------------------
// Relatório fotográfico
// Regras:
//  - Foto 1 (capa) vai na capa — excluída do anexo, mas conta na numeração
//  - Fotos ausentes são ignoradas — numeração ajustada automaticamente
//  - Layout: 1 foto por linha, tamanho generoso para boa visualização
// ---------------------------------------------------------------------------
function gerarAnexoFotografico(fotos: any[]): string {
  const fotosPorTipo = new Map(fotos.map((f: any) => [f.tipo, f]));

  const fotosPresentes: { numero: number; url: string; legenda: string }[] = [];
  let contador = 1; // capa = imagem 1, fica na capa

  for (const def of ORDEM_FOTOS) {
    if (def.tipo === "capa") { contador++; continue; } // conta mas não entra no anexo

    const foto = fotosPorTipo.get(def.tipo);
    if (!foto) continue; // ausente → pula sem incrementar

    const url = fotoParaBase64(foto.url || foto.storage_url || "");
    if (!url) continue;

    fotosPresentes.push({ numero: contador, url, legenda: foto.legenda || def.label });
    contador++;
  }

  if (fotosPresentes.length === 0) return "";

  // Layout: 1 foto por página (ou agrupadas 2 por página com boa altura)
  const blocos = fotosPresentes.map((f) => `
    <div style="page-break-inside:avoid; break-inside:avoid; margin-bottom:10mm; text-align:center;">
      <div style="border:0.5pt solid #ddd; border-radius:2mm; overflow:hidden; background:#fafafa; padding:3mm; display:inline-block; width:100%;">
        <img src="${f.url}"
             style="width:100%; max-height:160mm; object-fit:contain; display:block;" />
        <p style="margin-top:3mm; font-size:9pt; font-style:italic; color:#444; text-align:center;">
          Imagem ${f.numero} — ${f.legenda}
        </p>
      </div>
    </div>`).join("\n");

  return `
<div class="page-break"></div>
<h2>ANEXO 01 - RELATÓRIO FOTOGRAFICO</h2>
<p style="font-size:9pt; color:#666; margin-bottom:6mm;">
  Total de ${fotosPresentes.length} foto${fotosPresentes.length !== 1 ? "s" : ""} registrada${fotosPresentes.length !== 1 ? "s" : ""}.
</p>
${blocos}`;
}

// ---------------------------------------------------------------------------
// Anexo 02 — Inspeções e Ensaios Frequentes (checklist do operador)
// Replicado exatamente conforme o laudo original
// ---------------------------------------------------------------------------
function gerarAnexo02(_veiculo: any, repeticoes = 5): string {
  const campo = `<td style="border:0.5pt solid #999; width:18px; text-align:center; font-weight:bold; font-size:8pt;"></td>`;

  const tabela = () => `
    <table style="width:100%; border-collapse:collapse; font-size:8pt; margin-bottom:4mm;">
      <thead>
        <tr>
          <th colspan="2" style="border:1pt solid #1e2d48; background:#1e2d48; color:#fff; padding:2.5mm 3mm; text-align:center; width:46%;">INSPEÇÕES FEITAS ANTES DO IÇAMENTO DE CARGA</th>
          <th style="border:1pt solid #1e2d48; background:#1e2d48; color:#fff; padding:1mm; text-align:center; width:18px; font-size:7pt;">A</th>
          <th style="border:1pt solid #1e2d48; background:#1e2d48; color:#fff; padding:1mm; text-align:center; width:18px; font-size:7pt;">R</th>
          <th style="border:1pt solid #1e2d48; background:#1e2d48; color:#fff; padding:2.5mm 3mm; text-align:center; width:46%;">INSPEÇÕES FEITAS ANTES DO IÇAMENTO DE CARGA</th>
          <th style="border:1pt solid #1e2d48; background:#1e2d48; color:#fff; padding:1mm; text-align:center; width:18px; font-size:7pt;">A</th>
          <th style="border:1pt solid #1e2d48; background:#1e2d48; color:#fff; padding:1mm; text-align:center; width:18px; font-size:7pt;">R</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm; font-weight:bold; background:#f0f0f0;">Nível de fluidos</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm; font-weight:bold; background:#f0f0f0;">Danos na Estrutura, lança e pneus</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">a) Óleo de motor</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm;">a) Inspeção visual do veículo de danos que possam ter acontecido</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">b) Água do Radiador</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm;">b) Calibragem dos pneus e remova qualquer material estranho na banda de rodagem</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">c) Óleo Hidráulico</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm;">c) Inspecionar as roldanas do moitão e da ponta da lança</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm; font-weight:bold; background:#f0f0f0;">Luzes de Alerta e Equip/Instr. segurança</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm;">d) verifique as condições dos cabos de aço</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">a) Rodas/Aros/Pneus</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm;">e) Verificar as condições das cintas</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">b) Sistema de Freio</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm;">F) verificar qualquer tipo de vazamento no sistema hidráulico</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">c) Dispositivos de Iluminação Refletores</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm; font-weight:bold; background:#f0f0f0;" rowspan="6">Anotação de qualquer anormalidade, manutenção ou incidente:</td>
          <td style="border:0.5pt solid #999;" rowspan="6"></td><td style="border:0.5pt solid #999;" rowspan="6"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">d) Mecanismo de direção</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">e) Buzina</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">f) Retrovisores</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">g) Limpador de Para-brisa</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">h) Instrumentos de painéis</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border:0.5pt solid #999; padding:1.5mm 3mm;">I) Guincho</td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
          <td style="border:0.5pt solid #999; padding:1.5mm 3mm;"></td>
          <td style="border:0.5pt solid #999;"></td><td style="border:0.5pt solid #999;"></td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td colspan="4" style="border:1pt solid #999; padding:2mm 3mm; font-size:8pt;">
            DATA DA INSPEÇÃO: ______ / ______ / __________
          </td>
          <td colspan="3" style="border:1pt solid #999; padding:2mm 3mm; font-size:8pt;">
            NOME DO OPERADOR: _______________________________
          </td>
        </tr>
        <tr>
          <td colspan="7" style="border:1pt solid #999; padding:2.5mm 3mm; font-size:9pt; font-weight:bold; background:#f0f0f0;">
            Legenda: &nbsp;&nbsp; <span style="font-weight:bold;">A</span> - Aprovado &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-weight:bold;">R</span> - Reprovado
          </td>
        </tr>
      </tbody>
    </table>`;

  const folhas = Array.from({ length: repeticoes }, (_, idx) => `
    ${idx > 0 ? '<div class="page-break"></div>' : ""}
    ${tabela()}`).join("");

  return `
<div class="page-break"></div>
<h2>ANEXO 02 - INSPEÇÕES E ENSAIOS FREQUENTES DO GUINDASTE HIDRÁULICO</h2>
${folhas}`;
}


// ---------------------------------------------------------------------------
// Template principal
// ---------------------------------------------------------------------------
export function buildTemplate(dados: DadosPDF): string {
  const { laudo, proprietario, implemento, veiculo, caracteristicas, itens_inspecao, fotos, user } = dados;

  
  const eng = (dados as any).engenheiro || null;
  const nomeEng = eng?.nome || user.nome;
  const creaEng = eng?.crea_numero || user.crea_numero || "___";
  const estadoEng = eng?.crea_estado || user.crea_estado || "__";
  const especialidadeEng = eng?.especialidade || "Engenheiro Mecânico";

  const gruposItens = agruparPorSecao(itens_inspecao);
  const ordemSecoes = ["5.1", "5.2", "5.3", "5.4", "5.5"];

  const fotoCapa = fotos.find((f: any) => f.tipo === "capa");
  const fotoCapaUrl = fotoParaBase64(fotoCapa?.url || fotoCapa?.storage_url || "");

  const endereco = proprietario?.endereco || "";
  const matchCidade = endereco.match(/,\s*([^,\/]+)\/([A-Z]{2})/);
  const localInspecao = matchCidade
    ? `${matchCidade[1].trim()} — ${matchCidade[2]}`
    : user.crea_estado ? `__________ — ${user.crea_estado}` : "__________";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 25mm 20mm 20mm 25mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.5; }

  .page-break { page-break-before: always; }

  /* CAPA */
  .capa { text-align: center; padding-top: 10mm; }
  .capa h1 { font-size: 13pt; font-weight: bold; line-height: 1.6; margin-bottom: 6mm; text-transform: uppercase; }
  .capa .numero { font-size: 12pt; font-weight: bold; margin-bottom: 6mm; }
  .capa .foto-capa { width: 90%; max-height: 100mm; object-fit: contain; margin: 4mm auto; display: block; border: 0.5pt solid #ddd; }
  .capa .legenda-foto { font-size: 9pt; color: #555; font-style: italic; margin-bottom: 6mm; }
  .capa .dados-rt { margin-top: 8mm; text-align: left; display: inline-block; }
  .capa .dados-rt p { font-size: 10pt; margin: 1.5mm 0; }
  .capa .dados-rt strong { font-weight: bold; }

  /* CABEÇALHOS DE SEÇÃO */
  h2 { font-size: 10.5pt; font-weight: bold; text-transform: uppercase;
       border-bottom: 1pt solid #1a1a1a; padding-bottom: 1.5mm; margin: 6mm 0 3mm 0; }
  h3 { font-size: 10pt; font-weight: bold; margin: 4mm 0 2mm 0; }

  /* DADOS SIMPLES: label — valor */
  .dado { font-size: 10pt; margin: 1mm 0; }
  .dado strong { font-weight: bold; }

  /* TABELA DE INSPEÇÃO */
  .inspecao-table { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm 0; font-size: 9pt; }
  .inspecao-table th { background: #1e2d48; color: #fff; padding: 2mm 3mm; text-align: left; font-size: 8.5pt; border: 0.5pt solid #1e2d48; }
  .inspecao-table td { padding: 2mm 3mm; border: 0.5pt solid #bbb; vertical-align: top; }
  .inspecao-table tr:nth-child(even) td { background: #f7f7f7; }

  /* CONSIDERAÇÕES */
  .consideracao { text-align: justify; margin: 2.5mm 0; line-height: 1.6; font-size: 10pt; }

  /* CONCLUSÃO */
  .conclusao-box { border: 1.5pt solid #1a1a1a; padding: 5mm 8mm; margin: 5mm 0; text-align: left; page-break-inside: avoid; }
  .conclusao-box p { font-size: 10pt; font-weight: bold; margin: 2mm 0; line-height: 1.8; }

  /* ASSINATURA */
  .assinatura { margin-top: 15mm; display: flex; justify-content: space-around; }
  .assinatura-bloco { text-align: center; width: 45%; }
  .assinatura-bloco .linha { border-top: 1pt solid #333; padding-top: 2mm; margin-bottom: 1mm; }
</style>
</head>
<body>

<!-- ===================== CAPA ===================== -->
<div class="capa">
  <h1>Inspeção Periódica para Guindaste Articulado Hidráulico Instalado sobre Chassi Veicular — Caminhão Munk (Guindauto)</h1>
  <div class="numero">LAUDO DE INSPEÇÃO Nº: ${formatarNumeroLaudo(laudo.numero_inspecao)}</div>
  ${fotoCapaUrl ? `<img src="${fotoCapaUrl}" class="foto-capa" /><div class="legenda-foto">Imagem 1 - caminhão munk</div>` : ""}
  <div class="dados-rt">
    <p><strong>RESPONSÁVEL TÉCNICO:</strong> ${nomeEng}</p>
    <p><strong>N° CREA:</strong> ${creaEng}/${estadoEng}</p>
    <p><strong>N° ART:</strong> ${laudo.art_numero || "___"}</p>
    <p><strong>DATA DA INSPEÇÃO:</strong> ${formatarData(laudo.data_inspecao)}</p>
    <p><strong>VALIDADE:</strong> ${formatarData(laudo.data_validade)}</p>
  </div>
</div>

<!-- ===================== TERMO DE ABERTURA ===================== -->
<div class="page-break"></div>
<h2>Termo de Abertura do Livro de Registros de Inspeção e Manutenção</h2>

<p class="consideracao" style="margin-top:5mm; text-indent:10mm;">
  O presente Relatório de Inspeção Periódica tem por objetivo avaliar as condições técnicas e de
  segurança do guindaste articulado hidráulico (guindauto) instalado sobre chassi veicular, de propriedade
  da empresa <strong>${proprietario?.razao_social || "___"}</strong>, inscrita no CNPJ nº
  <strong>${proprietario?.cnpj || "___"}</strong>, instalado no veículo de placa
  <strong>${veiculo?.placa || "___"}</strong>, marca/modelo
  <strong>${veiculo?.marca_modelo || "___"}</strong>, implemento fabricado por
  <strong>${implemento?.fabricante || "___"}</strong>, modelo
  <strong>${implemento?.modelo || "___"}</strong>${implemento?.numero_serie ? `, número de série <strong>${implemento.numero_serie}</strong>` : ""}.
</p>

<p class="consideracao" style="margin-top:4mm; text-indent:10mm;">
  A inspeção foi realizada em conformidade com as seguintes normas regulamentadoras e normas técnicas:
  NR-11 (Transporte, Movimentação, Armazenagem e Manuseio de Materiais), NR-12 (Segurança no Trabalho
  em Máquinas e Equipamentos), ABNT NBR 14768:2015 (Guindastes Articulados Hidráulicos),
  ABNT NBR 16092:2012 (Dispositivos de Movimentação e Elevação de Cargas) e Resolução CONTRAN
  316/2009 (Requisitos de Segurança Veicular).
</p>

<p class="consideracao" style="margin-top:4mm; text-indent:10mm;">
  A metodologia empregada consistiu em análise visual, dimensional e funcional dos componentes
  estruturais, hidráulicos, de segurança e operacionais do equipamento, por meio de checklist técnico
  baseado nas normas supracitadas, com registro fotográfico das condições encontradas.
</p>

<p class="consideracao" style="margin-top:4mm; text-indent:10mm;">
  A inspeção foi conduzida por profissional habilitado, devidamente registrado no Conselho Regional
  de Engenharia e Agronomia (CREA), com Anotação de Responsabilidade Técnica (ART) vinculada a este
  documento, assumindo inteira responsabilidade técnica pelos dados e conclusões aqui apresentados.
</p>

<p style="text-align:right; margin-top:18mm; font-size:10pt;">
  RONDONÓPOLIS - MT, ${formatarDataExtenso(laudo.data_inspecao).toUpperCase()}.
</p>

<div class="assinatura" style="margin-top:20mm;">
  <div class="assinatura-bloco">
    <div class="linha"></div>
    <p style="font-size:10pt;">${nomeEng}</p>
    <p style="font-size:10pt; font-weight:bold;">${especialidadeEng}</p>
    <p style="font-size:10pt; font-weight:bold;">CREA ${creaEng}/${estadoEng}</p>
  </div>
  <div class="assinatura-bloco">
    <div class="linha"></div>
    <p style="font-size:10pt;">${proprietario?.razao_social || "___"}</p>
    <p style="font-size:10pt; font-weight:bold;">CNPJ: ${proprietario?.cnpj || "___"}</p>
  </div>
</div>

<!-- ===================== 1. PROPRIETÁRIO ===================== -->
<div class="page-break"></div>
<h2>1. Dados do Proprietário</h2>
${proprietario?.razao_social ? `<p class="dado"><strong>RAZÃO SOCIAL:</strong> ${proprietario.razao_social}</p>` : ""}
${proprietario?.cnpj        ? `<p class="dado"><strong>CNPJ:</strong> ${proprietario.cnpj}</p>` : ""}
${proprietario?.endereco    ? `<p class="dado"><strong>ENDEREÇO:</strong> ${proprietario.endereco}</p>` : ""}
${proprietario?.email       ? `<p class="dado"><strong>EMAIL:</strong> ${proprietario.email}</p>` : ""}
${proprietario?.telefone    ? `<p class="dado"><strong>TELEFONE:</strong> ${proprietario.telefone}</p>` : ""}

<!-- ===================== 2. IMPLEMENTO ===================== -->
<h2 style="margin-top:6mm;">2. Dados do Implemento (Equipamento Guindauto)</h2>
${implemento?.fabricante        ? `<p class="dado"><strong>RAZÃO SOCIAL:</strong> ${implemento.fabricante}</p>` : ""}
${implemento?.modelo            ? `<p class="dado"><strong>MODELO:</strong> ${implemento.modelo}</p>` : ""}
${implemento?.numero_serie      ? `<p class="dado"><strong>Nº DE SÉRIE:</strong> ${implemento.numero_serie}</p>` : ""}
${implemento?.ano_fabricacao    ? `<p class="dado"><strong>ANO DE FABRICAÇÃO:</strong> ${implemento.ano_fabricacao}</p>` : ""}
${implemento?.peso              ? `<p class="dado"><strong>PESO:</strong> ${implemento.peso}</p>` : ""}
${implemento?.pressao_trabalho  ? `<p class="dado"><strong>PRESSÃO MÁX. TRABALHO:</strong> ${implemento.pressao_trabalho}</p>` : ""}
${implemento?.capacidade_carga  ? `<p class="dado"><strong>CAPACIDADE CARGA:</strong> ${implemento.capacidade_carga}</p>` : ""}
${implemento?.alcance_horizontal? `<p class="dado"><strong>ALCANCE HORIZONTAL MÁX.:</strong> ${implemento.alcance_horizontal}</p>` : ""}
${implemento?.alcance_vertical  ? `<p class="dado"><strong>ALCANCE VERTICAL MÁX.:</strong> ${implemento.alcance_vertical}</p>` : ""}
${implemento?.angulo_giro       ? `<p class="dado"><strong>ANGULO DE GIRO:</strong> ${implemento.angulo_giro}</p>` : ""}
${implemento?.horimetro         ? `<p class="dado"><strong>HORÍMETRO:</strong> ${implemento.horimetro}</p>` : ""}

<!-- ===================== 3. VEÍCULO ===================== -->
<h2 style="margin-top:6mm;">3. Dados da Base ou Veículo onde o Implemento de Carga é Instalado</h2>
${veiculo?.tipo        ? `<p class="dado"><strong>TIPO:</strong> ${veiculo.tipo}</p>` : ""}
${veiculo?.placa       ? `<p class="dado"><strong>PLACA:</strong> ${veiculo.placa}</p>` : ""}
${veiculo?.ano_modelo  ? `<p class="dado"><strong>ANO/MODELO:</strong> ${veiculo.ano_modelo}</p>` : ""}
${veiculo?.chassi      ? `<p class="dado"><strong>CHASSI:</strong> ${veiculo.chassi}</p>` : ""}
${veiculo?.renavan     ? `<p class="dado"><strong>RENAVAN:</strong> ${veiculo.renavan}</p>` : ""}
${veiculo?.marca_modelo? `<p class="dado"><strong>MARCA/MODELO:</strong> ${veiculo.marca_modelo}</p>` : ""}
${veiculo?.num_eixos   ? `<p class="dado"><strong>Nº DE EIXOS:</strong> ${veiculo.num_eixos}</p>` : ""}
${veiculo?.pbtc        ? `<p class="dado"><strong>PESO BRUTO TOTAL COMBINADO:</strong> ${veiculo.pbtc}</p>` : ""}
${veiculo?.hodometro    ? `<p class="dado"><strong>HODÔMETRO:</strong> ${veiculo.hodometro}</p>` : ""}

<!-- ===================== 4. CARACTERÍSTICAS ===================== -->
<h2 style="margin-top:6mm;">4. Características Atuais do Veículo</h2>
${caracteristicas?.distancia_entre_eixos    ? `<p class="dado"><strong>DISTÂNCIA ENTRE-EIXOS (1° AO 2°):</strong> ${caracteristicas.distancia_entre_eixos}</p>` : ""}
${caracteristicas?.comprimento_total        ? `<p class="dado"><strong>COMPRIMENTO MÁXIMO:</strong> ${caracteristicas.comprimento_total}</p>` : ""}
${caracteristicas?.comprimento_carroceria   ? `<p class="dado"><strong>COMPRIMENTO DA CARROCERIA:</strong> ${caracteristicas.comprimento_carroceria}</p>` : ""}
${caracteristicas?.largura                  ? `<p class="dado"><strong>LARGURA MÁXIMA:</strong> ${caracteristicas.largura}</p>` : ""}
${caracteristicas?.altura                   ? `<p class="dado"><strong>ALTURA MÁXIMA:</strong> ${caracteristicas.altura}</p>` : ""}
${caracteristicas?.qtd_eixos_rodas          ? `<p class="dado"><strong>QUANTIDADE DE EIXOS/RODAS:</strong> ${caracteristicas.qtd_eixos_rodas}</p>` : ""}
${caracteristicas?.eixos_motrizes           ? `<p class="dado"><strong>EIXOS MOTRIZES:</strong> ${caracteristicas.eixos_motrizes}</p>` : ""}
${caracteristicas?.pbtc                     ? `<p class="dado"><strong>PBTC:</strong> ${caracteristicas.pbtc}</p>` : ""}
${caracteristicas?.cmt                      ? `<p class="dado"><strong>CMT:</strong> ${caracteristicas.cmt}</p>` : ""}

<!-- ===================== 5. INSPEÇÕES ===================== -->
<h2 style="margin-top:8mm;">5. Inspeções</h2>
<p class="consideracao" style="margin-bottom:4mm;">Com base na ABNT NBR 14768:2015, NBR 16092:2012, NR-11 e NR-12</p>

${ordemSecoes.map((secaoId) => {
  const itens: any[] = gruposItens[secaoId] || [];
  if (itens.length === 0) return "";
  const nomeSecao = NOMES_SECOES[secaoId] || secaoId;
  const linhas = [...itens]
    .sort((a, b) => {
      const [, na] = a.numero_item.split(".").map(Number);
      const [, nb] = b.numero_item.split(".").map(Number);
      return na - nb;
    })
    .map((item) => `
      <tr>
        <td style="width:10%; text-align:center; font-weight:bold;">${item.numero_item}</td>
        <td style="width:42%">${item.descricao}</td>
        <td style="width:24%">${situacaoCheckboxes(item.situacao)}</td>
        <td style="width:24%">${item.observacoes || ""}</td>
      </tr>`).join("");
  return `
    <h3>${secaoId}. ${nomeSecao.toUpperCase()}</h3>
    <table class="inspecao-table">
      <thead>
        <tr>
          <th style="width:10%; text-align:center;">ITEM</th>
          <th style="width:42%">DESCRIÇÃO</th>
          <th style="width:24%">SITUAÇÃO</th>
          <th style="width:24%">OBSERVAÇÕES</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;
}).join("")}

${gerarTabelaReprovados(itens_inspecao)}

<!-- ===================== 6. CONSIDERAÇÕES TÉCNICAS ===================== -->
<div class="page-break"></div>
<h2>6. Considerações Técnicas</h2>

<p class="consideracao"><strong>6.1.</strong> É obrigatório a troca das mangueiras de alta pressão com no máximo 72 meses mesmo que suas condições visuais estejam normais. As mangueiras do presente implemento, objeto desta inspeção apresentam conservação qualificada como conforme, sem deteriorização devido a exposição solar. Consultar o manual do proprietário ou o responsável técnico para a manutenção.</p>
<p class="consideracao"><strong>6.2.</strong> Tipo de óleo: O óleo usado no sistema hidráulico deve possuir no mínimo as seguintes características: antioxidante, antiespumante, anticorrosivo e antidesgastante.</p>
<p class="consideracao"><strong>6.3.</strong> Instalar botão de emergência externo ao lado do comando principal, do guindaste. Para parar o movimento durante uma situação de emergência.</p>
<p class="consideracao"><strong>6.4.</strong> Em hipótese alguma o equipamento poderá ser utilizado com sinais de oxidação.</p>
<p class="consideracao"><strong>6.5.</strong> Atentar sempre para a carga, respeitando o gráfico de carga presente no manual do proprietário e as respectivas carga máxima.</p>
<p class="consideracao"><strong>6.6.</strong> Nunca operar o equipamento quando o conjunto de operação apresentar condições anormais de funcionamento, tais como: vazamentos, ruídos estranhos, etc...</p>
<p class="consideracao"><strong>6.7.</strong> Para segurança na operação e manutenção do implemento hidráulico instalado sobre veículo é obrigatório antes de qualquer operação com o equipamento, realizar as inspeções frequentes, aquelas que são observadas pelo próprio operador e ficaram registradas neste livro, fazendo parte da documentação obrigatória do equipamento.</p>
<p class="consideracao"><strong>6.8.</strong> Qualquer acidente, incidente, anormalidade ou manutenção realizada no equipamento, devem ser registradas neste livro, em caso grave, o responsável técnico deve que ser comunicado imediatamente.</p>
<p class="consideracao"><strong>6.9.</strong> As recomendações citadas acima devem ser cumpridas de imediato, caso contrário este relatório de inspeção e manutenção perderá seu efeito, e será necessária nova avaliação.</p>
<p class="consideracao"><strong>6.10.</strong> O equipamento deverá ser submetido à nova inspeção periódica sempre que:<br>
a) for danificado.<br>
b) for realizada qualquer alteração em seu corpo.<br>
c) sofre qualquer tipo de acidente.</p>

<!-- ===================== 7. CONCLUSÃO ===================== -->
<div class="page-break"></div>
<h2>7. Conclusão do Laudo</h2>
<p class="consideracao">Após inspeção visual, funcional e técnica, o guindauto instalado no veículo acima identificado:</p>

<div class="conclusao-box" style="margin-top:5mm;">
  <p>${cb(laudo.conclusao === "apto")} ESTÁ APTO para operação, atendendo às exigências da NR-11, NR-12, ABNT NBR 14768:2015, NBR 16092:2012 e demais normas aplicáveis.</p>
  <p>${cb(laudo.conclusao === "nao_apto")} NÃO ESTÁ APTO para operação até que sejam sanadas as não conformidades indicadas neste laudo.</p>
</div>

<!-- ===================== 8. REFERÊNCIAS NORMATIVAS ===================== -->
<h2 style="margin-top:6mm;">8. Referências Normativas</h2>
<p class="consideracao">- NR-11 – Transporte, movimentação, armazenagem e manuseio de materiais;</p>
<p class="consideracao">- NR-12 – Segurança no trabalho em máquinas e equipamentos;</p>
<p class="consideracao">- ABNT NBR 14768:2015 – Guindauto – Requisitos e métodos de ensaio;</p>
<p class="consideracao">- ABNT NBR 16092:2012 – Guindaste hidráulico articulado sobre caminhão – Requisitos de segurança;</p>
<p class="consideracao">- ISO 9927-1 – Cranes – Inspections – General;</p>
<p class="consideracao">- Manual do fabricante do equipamento;</p>
<p class="consideracao">- Código de Trânsito Brasileiro (CTB) e Resoluções do CONTRAN, quando aplicáveis.</p>

<!-- ===================== 9. RESPONSÁVEL TÉCNICO ===================== -->
<h2 style="margin-top:6mm;">9. Identificação do Responsável Técnico</h2>
<p class="dado"><strong>NOME:</strong> ${nomeEng}</p>
<p class="dado"><strong>REGISTRO PROFISSIONAL:</strong> CREA ${creaEng}/${estadoEng}</p>
<p class="dado"><strong>Nº da ART:</strong> ${laudo.art_numero || "___"}</p>
<p class="dado"><strong>DATA:</strong> ${formatarData(laudo.data_inspecao)}</p>

<!-- ===================== ANEXO 01 — FOTOS ===================== -->
${gerarAnexoFotografico(fotos)}

<!-- ===================== ANEXO 02 — CHECKLIST OPERADOR ===================== -->
${gerarAnexo02(veiculo, 5)}

</body>
</html>`;
}

"use client";

import { useState, useMemo } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, CheckCircle, XCircle, Minus } from "lucide-react";
import type { ItemInspecao, SituacaoItem } from "@/types/database";
import { NOMES_SECOES } from "@/lib/laudos/seed";

// Ordem exata das seções conforme laudo
const SECOES = [
  { id: "5.1", nome: NOMES_SECOES["5.1"] },
  { id: "5.2", nome: NOMES_SECOES["5.2"] },
  { id: "5.3", nome: NOMES_SECOES["5.3"] },
  { id: "5.4", nome: NOMES_SECOES["5.4"] },
  { id: "5.5", nome: NOMES_SECOES["5.5"] },
];

function ItemInspecaoRow({
  item,
  onChange,
}: {
  item: ItemInspecao;
  onChange: (id: string, campo: string, valor: string) => void;
}) {
  const opcoes: { valor: SituacaoItem; label: string; cor: string; ringCor: string }[] = [
    { valor: "aprovado",      label: "Aprovado",  cor: "text-green-600", ringCor: "border-green-500 bg-green-500" },
    { valor: "reprovado",     label: "Reprovado", cor: "text-red-600",   ringCor: "border-red-500 bg-red-500"   },
    { valor: "nao_se_aplica", label: "N/A",       cor: "text-gray-400",  ringCor: "border-gray-400 bg-gray-400" },
  ];

  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 w-10 text-xs font-medium text-gray-400">
          {item.numero_item}
        </span>
        <div className="flex-1">
          <p className="text-sm text-gray-700">{item.descricao}</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {opcoes.map((op) => (
              <label
                key={op.valor}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 text-xs font-medium transition-colors",
                  item.situacao === op.valor ? op.cor : "text-gray-400 hover:text-gray-600"
                )}
              >
                <input
                  type="radio"
                  name={`item-${item.id}`}
                  checked={item.situacao === op.valor}
                  onChange={() => onChange(item.id, "situacao", op.valor)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 transition-colors",
                    item.situacao === op.valor ? op.ringCor : "border-gray-300"
                  )}
                />
                {op.label}
              </label>
            ))}
          </div>

          {item.situacao === "reprovado" && (
            <textarea
              value={item.observacoes || ""}
              onChange={(e) => onChange(item.id, "observacoes", e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Descreva a não conformidade encontrada..."
              rows={2}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function EtapaInspecoes() {
  const { laudo, setSalvando, proximaEtapa, etapaAnterior, atualizarSecao } = useWizardStore();
  const [secaoAberta, setSecaoAberta] = useState<string>("5.1");
  const [itens, setItens] = useState<ItemInspecao[]>(laudo?.itens_inspecao || []);

  const contadores = useMemo(() => {
    const result: Record<string, { total: number; avaliados: number; reprovados: number }> = {};
    for (const secao of SECOES) {
      const itensSecao = itens.filter((i) => i.secao === secao.id);
      result[secao.id] = {
        total: itensSecao.length,
        avaliados: itensSecao.filter((i) => i.situacao).length,
        reprovados: itensSecao.filter((i) => i.situacao === "reprovado").length,
      };
    }
    return result;
  }, [itens]);

  function handleItemChange(id: string, campo: string, valor: string) {
    setItens((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  async function salvarEAvancar() {
    setSalvando(true);
    try {
      const payload = itens
        .filter((i) => i.situacao)
        .map((i) => ({
          id: i.id,
          situacao: i.situacao,
          observacoes: i.observacoes,
          foto_url: i.foto_url,
        }));

      const res = await fetch(`/api/laudos/${laudo!.id}/inspecoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: payload }),
      });

      if (res.ok) {
        atualizarSecao("itens_inspecao", itens);
        proximaEtapa();
      }
    } finally {
      setSalvando(false);
    }
  }

  const totalAvaliados = itens.filter((i) => i.situacao).length;
  const totalItens = itens.length;
  const totalReprovados = itens.filter((i) => i.situacao === "reprovado").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Itens de Inspeção</h2>
        <div className="flex items-center gap-3 text-sm">
          {totalReprovados > 0 && (
            <span className="font-medium text-red-600">{totalReprovados} reprovado{totalReprovados !== 1 ? "s" : ""}</span>
          )}
          <span className="text-gray-500">{totalAvaliados}/{totalItens}</span>
        </div>
      </div>

      {/* Progresso geral */}
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            totalReprovados > 0 ? "bg-red-500" : "bg-blue-500"
          )}
          style={{ width: totalItens > 0 ? `${(totalAvaliados / totalItens) * 100}%` : "0%" }}
        />
      </div>

      {/* Seções accordion */}
      <div className="space-y-2">
        {SECOES.map((secao) => {
          const aberta = secaoAberta === secao.id;
          const cont = contadores[secao.id];
          const itensSecao = itens.filter((i) => i.secao === secao.id);
          const completa = cont.avaliados === cont.total && cont.total > 0;

          return (
            <div key={secao.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setSecaoAberta(aberta ? "" : secao.id)}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {completa ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                  ) : cont.reprovados > 0 ? (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 shrink-0 text-gray-300" />
                  )}
                  <span className="text-sm font-medium text-gray-900 text-left">
                    {secao.id} — {secao.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {cont.reprovados > 0 && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {cont.reprovados} reprovado{cont.reprovados !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{cont.avaliados}/{cont.total}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      aberta && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {aberta && (
                <div className="border-t border-gray-100 px-4 py-2">
                  {itensSecao.map((item) => (
                    <ItemInspecaoRow
                      key={item.id}
                      item={item}
                      onChange={handleItemChange}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={etapaAnterior} className="btn-secondary">
          Voltar
        </button>
        <button onClick={salvarEAvancar} className="btn-primary">
          Salvar e Avançar
        </button>
      </div>
    </div>
  );
}

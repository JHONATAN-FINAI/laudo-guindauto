"use client";

import { useState, useMemo } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, CheckCircle, XCircle, Minus } from "lucide-react";
import type { ItemInspecao, SituacaoItem } from "@/types/database";

const SECOES = [
  { id: "5.1", nome: "Estrutura e Componentes Mecânicos" },
  { id: "5.2", nome: "Sistema Hidráulico" },
  { id: "5.3", nome: "Estabilizadores e Fixação" },
  { id: "5.4", nome: "Acessórios de Carga e Içamento" },
  { id: "5.5", nome: "Dispositivos de Segurança" },
];

function ItemInspecaoRow({
  item,
  onChange,
}: {
  item: ItemInspecao;
  onChange: (id: string, campo: string, valor: any) => void;
}) {
  const opcoes: { valor: SituacaoItem; label: string; cor: string }[] = [
    { valor: "aprovado", label: "Aprovado", cor: "text-green-600" },
    { valor: "reprovado", label: "Reprovado", cor: "text-red-600" },
    { valor: "nao_se_aplica", label: "N/A", cor: "text-gray-400" },
  ];

  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-xs font-medium text-gray-400">
          {item.numero_item}
        </span>
        <div className="flex-1">
          <p className="text-sm text-gray-700">{item.descricao}</p>
          <div className="mt-2 flex gap-3">
            {opcoes.map((op) => (
              <label
                key={op.valor}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 text-xs font-medium",
                  item.situacao === op.valor ? op.cor : "text-gray-400"
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
                    item.situacao === op.valor
                      ? op.valor === "aprovado"
                        ? "border-green-500 bg-green-500"
                        : op.valor === "reprovado"
                        ? "border-red-500 bg-red-500"
                        : "border-gray-400 bg-gray-400"
                      : "border-gray-300"
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
              className="input-field mt-2"
              placeholder="Observações (obrigatório para itens reprovados)"
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
  const [itens, setItens] = useState<ItemInspecao[]>(
    laudo?.itens_inspecao || []
  );

  // Contadores por seção
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

  function handleItemChange(id: string, campo: string, valor: any) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  }

  async function salvarEAvancar() {
    setSalvando(true);
    try {
      const itensModificados = itens
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
        body: JSON.stringify({ itens: itensModificados }),
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Itens de Inspeção
        </h2>
        <span className="text-sm text-gray-500">
          {totalAvaliados}/{totalItens} avaliados
        </span>
      </div>

      {/* Progresso geral */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${(totalAvaliados / totalItens) * 100}%` }}
        />
      </div>

      {/* Seções accordion */}
      <div className="space-y-2">
        {SECOES.map((secao) => {
          const aberta = secaoAberta === secao.id;
          const cont = contadores[secao.id];
          const itensSecao = itens.filter((i) => i.secao === secao.id);
          const completa = cont.avaliados === cont.total;

          return (
            <div key={secao.id} className="rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setSecaoAberta(aberta ? "" : secao.id)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {completa ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : cont.reprovados > 0 ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-300" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {secao.id} - {secao.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {cont.avaliados}/{cont.total}
                  </span>
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

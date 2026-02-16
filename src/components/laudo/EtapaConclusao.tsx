"use client";

import { useState, useEffect } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";

export function EtapaConclusao() {
  const { laudo, atualizarSecao, setSalvando } = useWizardStore();
  const [conclusao, setConclusao] = useState<string>(laudo?.conclusao || "");
  const [artNumero, setArtNumero] = useState<string>(laudo?.art_numero || "");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    setConclusao(laudo?.conclusao || "");
    setArtNumero(laudo?.art_numero || "");
  }, [laudo?.conclusao, laudo?.art_numero]);

  // Validação de completude
  const itensAvaliados = laudo?.itens_inspecao?.filter((i: { situacao: string | null }) => i.situacao !== null).length || 0;
  const totalItens = laudo?.itens_inspecao?.length || 36;
  const temFotoCapa = laudo?.fotos?.some((f: { tipo: string }) => f.tipo === "capa") || false;
  const todosItensAvaliados = itensAvaliados === totalItens;

  const podeFinalizar = conclusao && artNumero && todosItensAvaliados && temFotoCapa;

  async function salvarConclusao() {
    if (!laudo) return;
    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch(`/api/laudos/${laudo.id}/conclusao`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conclusao: conclusao || null,
          art_numero: artNumero || null,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar conclusão");

      const dados = await res.json();
      atualizarSecao("conclusao", dados.conclusao);
      atualizarSecao("art_numero", dados.art_numero);
      setSucesso("Conclusão salva");
      setTimeout(() => setSucesso(null), 2000);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function finalizarLaudo() {
    if (!laudo || !podeFinalizar) return;

    // Salva conclusão primeiro
    await salvarConclusao();

    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch(`/api/laudos/${laudo.id}/finalizar`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao finalizar laudo");
      }

      const dados = await res.json();
      // Atualiza o laudo completo no store
      atualizarSecao("status", "finalizado");
      atualizarSecao("numero_inspecao", dados.numero_inspecao);
      atualizarSecao("data_validade", dados.data_validade);
      setSucesso(`Laudo finalizado! Nº ${dados.numero_inspecao}`);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const isFinalizado = laudo?.status === "finalizado";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">7. Conclusão</h2>

      {/* Conclusão */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">
          Resultado da Inspeção
        </legend>
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-green-50">
          <input
            type="radio"
            name="conclusao"
            value="apto"
            checked={conclusao === "apto"}
            onChange={(e) => setConclusao(e.target.value)}
            disabled={isFinalizado}
            className="w-5 h-5 text-green-600"
          />
          <div>
            <span className="font-medium text-green-700">APTO</span>
            <p className="text-xs text-gray-500">
              Equipamento em condições de operação
            </p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-red-50">
          <input
            type="radio"
            name="conclusao"
            value="nao_apto"
            checked={conclusao === "nao_apto"}
            onChange={(e) => setConclusao(e.target.value)}
            disabled={isFinalizado}
            className="w-5 h-5 text-red-600"
          />
          <div>
            <span className="font-medium text-red-700">NÃO APTO</span>
            <p className="text-xs text-gray-500">
              Equipamento com pendências que impedem operação
            </p>
          </div>
        </label>
      </fieldset>

      {/* ART */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Número da ART
        </label>
        <input
          type="text"
          value={artNumero}
          onChange={(e) => setArtNumero(e.target.value)}
          placeholder="Ex: 12345678"
          disabled={isFinalizado}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500">
          Se a ART ainda não saiu, salve como rascunho e volte depois para inserir.
        </p>
      </div>

      {/* Checklist de pré-requisitos */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Requisitos para finalizar:
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className={conclusao ? "text-green-600" : "text-gray-400"}>
              {conclusao ? "✓" : "○"}
            </span>
            Conclusão definida (APTO/NÃO APTO)
          </div>
          <div className="flex items-center gap-2">
            <span className={artNumero ? "text-green-600" : "text-gray-400"}>
              {artNumero ? "✓" : "○"}
            </span>
            Número da ART informado
          </div>
          <div className="flex items-center gap-2">
            <span className={todosItensAvaliados ? "text-green-600" : "text-gray-400"}>
              {todosItensAvaliados ? "✓" : "○"}
            </span>
            Todos os itens avaliados ({itensAvaliados}/{totalItens})
          </div>
          <div className="flex items-center gap-2">
            <span className={temFotoCapa ? "text-green-600" : "text-gray-400"}>
              {temFotoCapa ? "✓" : "○"}
            </span>
            Foto de capa adicionada
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{erro}</p>
      )}
      {sucesso && (
        <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{sucesso}</p>
      )}

      {/* Ações */}
      {!isFinalizado && (
        <div className="flex gap-3">
          <button
            onClick={salvarConclusao}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Salvar Rascunho
          </button>
          <button
            onClick={finalizarLaudo}
            disabled={!podeFinalizar}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            Finalizar Laudo
          </button>
        </div>
      )}

      {isFinalizado && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-medium text-green-700">
            Laudo finalizado — Nº {laudo?.numero_inspecao}
          </p>
          <p className="text-sm text-green-600 mt-1">
            Validade: {laudo?.data_validade}
          </p>
          <a
            href={`/api/laudos/${laudo?.id}/pdf`}
            target="_blank"
            className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Baixar PDF
          </a>
        </div>
      )}
    </div>
  );
}

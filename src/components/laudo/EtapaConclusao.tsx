"use client";

import { useState, useEffect } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";
import type { Engenheiro } from "@/types/database";

export function EtapaConclusao() {
  const { laudo, atualizarSecao, setSalvando } = useWizardStore();
  const [conclusao, setConclusao] = useState<string>(laudo?.conclusao || "");
  const [artNumero, setArtNumero] = useState<string>(laudo?.art_numero || "");
  const [engenheiroId, setEngenheiroId] = useState<string>(laudo?.engenheiro_id || "");
  const [engenheiros, setEngenheiros] = useState<Engenheiro[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    setConclusao(laudo?.conclusao || "");
    setArtNumero(laudo?.art_numero || "");
    setEngenheiroId(laudo?.engenheiro_id || "");
  }, [laudo?.conclusao, laudo?.art_numero, laudo?.engenheiro_id]);

  useEffect(() => {
    fetch("/api/engenheiros")
      .then((r) => r.json())
      .then((data) => setEngenheiros(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const itensAvaliados = laudo?.itens_inspecao?.filter((i: any) => i.situacao !== null).length || 0;
  const totalItens = laudo?.itens_inspecao?.length || 30;
  const temFotoCapa = laudo?.fotos?.some((f: any) => f.tipo === "capa") || false;
  const todosItensAvaliados = itensAvaliados === totalItens;
  const podeFinalizar = conclusao && artNumero && engenheiroId && todosItensAvaliados && temFotoCapa;

  async function salvarConclusao() {
    if (!laudo) return;
    setSalvando(true); setErro(null);
    try {
      const res = await fetch(`/api/laudos/${laudo.id}/conclusao`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conclusao: conclusao || null, art_numero: artNumero || null }),
      });
      if (!res.ok) throw new Error("Erro ao salvar conclusão");

      if (engenheiroId !== (laudo.engenheiro_id || "")) {
        await fetch(`/api/laudos/${laudo.id}/engenheiro`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ engenheiro_id: engenheiroId || null }),
        });
        atualizarSecao("engenheiro_id", engenheiroId || null);
        const eng = engenheiros.find((e) => e.id === engenheiroId) || null;
        atualizarSecao("engenheiro", eng);
      }

      const dados = await res.json();
      atualizarSecao("conclusao", dados.conclusao);
      atualizarSecao("art_numero", dados.art_numero);
      setSucesso("Salvo com sucesso");
      setTimeout(() => setSucesso(null), 2000);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function finalizarLaudo() {
    if (!laudo || !podeFinalizar) return;
    await salvarConclusao();
    setSalvando(true); setErro(null);
    try {
      const res = await fetch(`/api/laudos/${laudo.id}/finalizar`, { method: "POST" });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao finalizar"); }
      const dados = await res.json();
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

  const isFinalizado = laudo != null && laudo.status === "finalizado";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">7. Conclusão</h2>

      {/* Engenheiro */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Engenheiro Responsável Técnico <span className="text-red-500">*</span>
        </label>
        {engenheiros.length === 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            Nenhum engenheiro cadastrado.{" "}
            <a href="/configuracoes" className="underline font-medium">Cadastre em Configurações →</a>
          </div>
        ) : (
          <select value={engenheiroId} onChange={(e) => setEngenheiroId(e.target.value)}
            disabled={isFinalizado}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 bg-white">
            <option value="">Selecione o engenheiro...</option>
            {engenheiros.filter((e) => e.ativo === "sim").map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome} — CREA {e.crea_numero}/{e.crea_estado} ({e.especialidade})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Conclusão */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">
          Resultado da Inspeção <span className="text-red-500">*</span>
        </legend>
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-green-50">
          <input type="radio" name="conclusao" value="apto" checked={conclusao === "apto"}
            onChange={(e) => setConclusao(e.target.value)} disabled={isFinalizado} className="w-5 h-5 text-green-600" />
          <div>
            <span className="font-medium text-green-700">APTO</span>
            <p className="text-xs text-gray-500">Equipamento em condições de operação</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-red-50">
          <input type="radio" name="conclusao" value="nao_apto" checked={conclusao === "nao_apto"}
            onChange={(e) => setConclusao(e.target.value)} disabled={isFinalizado} className="w-5 h-5 text-red-600" />
          <div>
            <span className="font-medium text-red-700">NÃO APTO</span>
            <p className="text-xs text-gray-500">Equipamento com pendências que impedem operação</p>
          </div>
        </label>
      </fieldset>

      {/* ART */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Número da ART <span className="text-red-500">*</span>
        </label>
        <input type="text" value={artNumero} onChange={(e) => setArtNumero(e.target.value)}
          placeholder="Ex: 12345678" disabled={isFinalizado}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
        <p className="text-xs text-gray-500">
          Se a ART ainda não saiu, salve como rascunho e volte depois para inserir.
        </p>
      </div>

      {/* Checklist */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <p className="text-sm font-medium text-gray-700">Requisitos para finalizar:</p>
        <div className="space-y-1 text-sm">
          {[
            { ok: !!engenheiroId, label: "Engenheiro responsável selecionado" },
            { ok: !!conclusao, label: "Conclusão definida (APTO / NÃO APTO)" },
            { ok: !!artNumero, label: "Número da ART informado" },
            { ok: todosItensAvaliados, label: `Todos os itens avaliados (${itensAvaliados}/${totalItens})` },
            { ok: temFotoCapa, label: "Foto de capa adicionada" },
          ].map(({ ok, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={ok ? "text-green-600" : "text-gray-400"}>{ok ? "✓" : "○"}</span>
              <span className={ok ? "text-gray-700" : "text-gray-400"}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{erro}</p>}
      {sucesso && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{sucesso}</p>}

      {!isFinalizado && (
        <div className="flex gap-3">
          <button onClick={salvarConclusao}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">
            Salvar Rascunho
          </button>
          <button onClick={finalizarLaudo} disabled={!podeFinalizar}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500">
            Finalizar Laudo
          </button>
        </div>
      )}

      {isFinalizado && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-medium text-green-700">Laudo finalizado — Nº {laudo?.numero_inspecao}</p>
          <p className="text-sm text-green-600 mt-1">Validade: {laudo?.data_validade}</p>
          <a href={`/api/laudos/${laudo?.id}/pdf`} target="_blank"
            className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            Baixar PDF
          </a>
        </div>
      )}
    </div>
  );
}

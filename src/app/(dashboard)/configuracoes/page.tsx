"use client";

import { useState, useEffect } from "react";
import type { Engenheiro } from "@/types/database";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

const ESTADO_VAZIO = { nome: "", crea_numero: "", crea_estado: "", especialidade: "Engenheiro Mecânico" };

function ModalEngenheiro({ eng, onSalvar, onFechar }: {
  eng: Partial<Engenheiro> | null;
  onSalvar: (dados: typeof ESTADO_VAZIO) => Promise<void>;
  onFechar: () => void;
}) {
  const [form, setForm] = useState({ ...ESTADO_VAZIO, ...(eng || {}) });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.crea_numero.trim() || !form.crea_estado.trim()) {
      setErro("Nome, CREA número e estado são obrigatórios"); return;
    }
    setSalvando(true); setErro(null);
    try { await onSalvar(form as typeof ESTADO_VAZIO); }
    catch (err: any) { setErro(err.message); }
    finally { setSalvando(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">{eng?.id ? "Editar Engenheiro" : "Novo Engenheiro"}</h2>
          <button onClick={onFechar} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: João da Silva"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CREA número *</label>
              <input type="text" value={form.crea_numero} onChange={(e) => setForm({ ...form, crea_numero: e.target.value })}
                placeholder="Ex: 36180"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <input type="text" value={form.crea_estado}
                onChange={(e) => setForm({ ...form, crea_estado: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="MT" maxLength={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
            <input type="text" value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
              placeholder="Engenheiro Mecânico"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          {erro && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{erro}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onFechar}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
            <button type="submit" disabled={salvando}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60">
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [engenheiros, setEngenheiros] = useState<Engenheiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [engSelecionado, setEngSelecionado] = useState<Engenheiro | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);

  useEffect(() => { carregarEngenheiros(); }, []);

  async function carregarEngenheiros() {
    setCarregando(true);
    try {
      const res = await fetch("/api/engenheiros");
      const data = await res.json();
      setEngenheiros(Array.isArray(data) ? data : []);
    } finally { setCarregando(false); }
  }

  async function salvarEngenheiro(dados: typeof ESTADO_VAZIO) {
    const url = engSelecionado?.id ? `/api/engenheiros/${engSelecionado.id}` : "/api/engenheiros";
    const method = engSelecionado?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro ao salvar"); }
    await carregarEngenheiros();
    setModalAberto(false); setEngSelecionado(null);
  }

  async function excluirEngenheiro(id: string) {
    const res = await fetch(`/api/engenheiros/${id}`, { method: "DELETE" });
    if (res.ok) setEngenheiros((prev) => prev.filter((e) => e.id !== id));
    setConfirmandoExclusao(null);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os engenheiros responsáveis técnicos</p>
        </div>
        <button onClick={() => { setEngSelecionado(null); setModalAberto(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Novo Engenheiro
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Engenheiros Cadastrados</h2>
        </div>
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : engenheiros.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">Nenhum engenheiro cadastrado.</p>
            <button onClick={() => setModalAberto(true)} className="mt-3 text-blue-600 text-sm underline">
              Cadastrar o primeiro
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {engenheiros.map((eng) => (
              <li key={eng.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{eng.nome}</p>
                  <p className="text-sm text-gray-500">CREA {eng.crea_numero}/{eng.crea_estado} · {eng.especialidade}</p>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button onClick={() => { setEngSelecionado(eng); setModalAberto(true); }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {confirmandoExclusao === eng.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600 mr-1">Confirmar?</span>
                      <button onClick={() => excluirEngenheiro(eng.id)}
                        className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setConfirmandoExclusao(null)}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmandoExclusao(eng.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalAberto && (
        <ModalEngenheiro eng={engSelecionado} onSalvar={salvarEngenheiro}
          onFechar={() => { setModalAberto(false); setEngSelecionado(null); }} />
      )}
    </div>
  );
}

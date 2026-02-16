"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StatusLaudo } from "@/types/database";

interface LaudoListItem {
  id: string;
  numero_inspecao: string | null;
  status: StatusLaudo;
  data_inspecao: string;
  data_validade: string | null;
  conclusao: string | null;
  art_numero: string | null;
  created_at: string;
  updated_at: string;
  proprietarios: { razao_social: string; cnpj: string } | null;
  veiculos: { placa: string; marca_modelo: string } | null;
  implementos: { fabricante: string; modelo: string } | null;
}

interface ListaLaudosProps {
  status: StatusLaudo;
  titulo: string;
}

export default function ListaLaudos({ status, titulo }: ListaLaudosProps) {
  const router = useRouter();
  const [laudos, setLaudos] = useState<LaudoListItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarLaudos();
  }, []);

  async function carregarLaudos() {
    setCarregando(true);
    try {
      const res = await fetch(`/api/laudos?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        // Normaliza relações (Supabase retorna arrays para select com join)
        setLaudos(
          data.map((l: any) => ({
            ...l,
            proprietarios: Array.isArray(l.proprietarios)
              ? l.proprietarios[0] || null
              : l.proprietarios,
            veiculos: Array.isArray(l.veiculos)
              ? l.veiculos[0] || null
              : l.veiculos,
            implementos: Array.isArray(l.implementos)
              ? l.implementos[0] || null
              : l.implementos,
          }))
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  async function excluirLaudo(id: string) {
    if (!confirm("Excluir este rascunho?")) return;
    const res = await fetch(`/api/laudos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLaudos((prev) => prev.filter((l) => l.id !== id));
    }
  }

  const laudosFiltrados = laudos.filter((l) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      l.proprietarios?.razao_social?.toLowerCase().includes(termo) ||
      l.veiculos?.placa?.toLowerCase().includes(termo) ||
      l.implementos?.modelo?.toLowerCase().includes(termo) ||
      l.numero_inspecao?.toLowerCase().includes(termo)
    );
  });

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
        <span className="text-sm text-gray-500">
          {laudos.length} laudo{laudos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Busca */}
      {laudos.length > 0 && (
        <input
          type="text"
          placeholder="Buscar por proprietário, placa ou modelo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-2.5 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}

      {/* Lista */}
      {laudosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">
            {laudos.length === 0
              ? `Nenhum laudo ${status === "rascunho" ? "em rascunho" : "finalizado"}`
              : "Nenhum resultado para a busca"}
          </p>
          {status === "rascunho" && laudos.length === 0 && (
            <Link
              href="/laudos/novo"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar Novo Laudo
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {laudosFiltrados.map((laudo) => (
            <div
              key={laudo.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Título principal */}
                  <p className="font-medium text-gray-900 truncate">
                    {laudo.proprietarios?.razao_social || "Proprietário não informado"}
                  </p>

                  {/* Info secundária */}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    {laudo.veiculos?.placa && (
                      <span>Placa: {laudo.veiculos.placa}</span>
                    )}
                    {laudo.implementos?.modelo && (
                      <span>{laudo.implementos.fabricante} {laudo.implementos.modelo}</span>
                    )}
                    {laudo.numero_inspecao && (
                      <span>Nº {laudo.numero_inspecao}</span>
                    )}
                  </div>

                  {/* Data e conclusão */}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="text-gray-400">
                      {new Date(laudo.data_inspecao).toLocaleDateString("pt-BR")}
                    </span>
                    {laudo.conclusao && (
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          laudo.conclusao === "apto"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {laudo.conclusao === "apto" ? "APTO" : "NÃO APTO"}
                      </span>
                    )}
                    {status === "rascunho" && !laudo.art_numero && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Pendente ART
                      </span>
                    )}
                    {laudo.data_validade && (
                      <span className="text-gray-400">
                        Val: {new Date(laudo.data_validade).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/laudos/${laudo.id}/editar`}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    {status === "rascunho" ? "Editar" : "Ver"}
                  </Link>

                  {status === "finalizado" && (
                    <a
                      href={`/api/laudos/${laudo.id}/pdf`}
                      target="_blank"
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      PDF
                    </a>
                  )}

                  {status === "rascunho" && (
                    <button
                      onClick={() => excluirLaudo(laudo.id)}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWizardStore, ETAPAS_WIZARD } from "@/hooks/useWizardStore";
import { WizardStepper } from "@/components/laudo/WizardStepper";
import { EtapaProprietario } from "@/components/laudo/EtapaProprietario";
import { EtapaImplemento } from "@/components/laudo/EtapaImplemento";
import { EtapaVeiculo } from "@/components/laudo/EtapaVeiculo";
import { EtapaCaracteristicas } from "@/components/laudo/EtapaCaracteristicas";
import { EtapaInspecoes } from "@/components/laudo/EtapaInspecoes";
import { EtapaFotos } from "@/components/laudo/EtapaFotos";
import { EtapaConclusao } from "@/components/laudo/EtapaConclusao";

const ETAPA_COMPONENTS = [
  EtapaProprietario,
  EtapaImplemento,
  EtapaVeiculo,
  EtapaCaracteristicas,
  EtapaInspecoes,
  EtapaFotos,
  EtapaConclusao,
];

export default function EditarLaudoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    etapaAtual,
    laudo,
    carregando,
    setLaudo,
    setCarregando,
    setEtapa,
    proximaEtapa,
    etapaAnterior,
  } = useWizardStore();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (id) carregarLaudo(id);
    setEtapa(0);
  }, [id]);

  async function carregarLaudo(laudoId: string) {
    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch(`/api/laudos/${laudoId}`);
      if (!res.ok) throw new Error("Laudo não encontrado");
      const data = await res.json();

      setLaudo({
        ...data,
        proprietario: Array.isArray(data.proprietarios)
          ? data.proprietarios[0] || null
          : data.proprietarios,
        implemento: Array.isArray(data.implementos)
          ? data.implementos[0] || null
          : data.implementos,
        veiculo: Array.isArray(data.veiculos)
          ? data.veiculos[0] || null
          : data.veiculos,
        caracteristicas: Array.isArray(data.caracteristicas_veiculo)
          ? data.caracteristicas_veiculo[0] || null
          : data.caracteristicas_veiculo,
        itens_inspecao: data.itens_inspecao || [],
        fotos: data.fotos_laudo || [],
        user: { nome: "", crea_numero: null, crea_estado: null },
      });
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Carregando laudo...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 rounded-lg text-center">
        <p className="text-red-600 font-medium">{erro}</p>
        <button
          onClick={() => router.push("/laudos/rascunhos")}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!laudo) return null;

  const isFinalizado = laudo.status === "finalizado";
  const EtapaComponent = ETAPA_COMPONENTS[etapaAtual];

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {isFinalizado ? `Laudo ${laudo.numero_inspecao}` : "Editar Rascunho"}
        </h1>
        {isFinalizado && (
          <p className="text-sm text-green-600 mt-1">
            Finalizado — Validade: {laudo.data_validade}
          </p>
        )}
        {!isFinalizado && !laudo.art_numero && (
          <p className="text-sm text-amber-600 mt-1">
            Pendente: inserir ART para finalizar
          </p>
        )}
      </div>

      <WizardStepper />

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <EtapaComponent />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:left-64">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={etapaAnterior}
            disabled={etapaAtual === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:text-gray-300"
          >
            Anterior
          </button>

          <span className="text-xs text-gray-400">
            {etapaAtual + 1} de {ETAPAS_WIZARD.length}
          </span>

          {etapaAtual < ETAPAS_WIZARD.length - 1 ? (
            <button
              onClick={proximaEtapa}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={() =>
                router.push(
                  isFinalizado ? "/laudos/finalizados" : "/laudos/rascunhos"
                )
              }
              className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
            >
              Voltar à Lista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NovoLaudoPage() {
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

  // Cria novo laudo ao montar a página
  useEffect(() => {
    criarLaudo();
    // Reset etapa ao montar
    setEtapa(0);
  }, []);

  async function criarLaudo() {
    setCarregando(true);
    setErro(null);

    try {
      // Cria o rascunho
      const resCriar = await fetch("/api/laudos", { method: "POST" });
      if (!resCriar.ok) throw new Error("Erro ao criar laudo");
      const novoLaudo = await resCriar.json();

      // Busca o laudo completo com todas as relações
      const resBuscar = await fetch(`/api/laudos/${novoLaudo.id}`);
      if (!resBuscar.ok) throw new Error("Erro ao carregar laudo");
      const laudoCompleto = await resBuscar.json();

      // Normaliza relações (Supabase retorna arrays para 1:1, pegamos o primeiro)
      setLaudo({
        ...laudoCompleto,
        proprietario: Array.isArray(laudoCompleto.proprietarios)
          ? laudoCompleto.proprietarios[0] || null
          : laudoCompleto.proprietarios,
        implemento: Array.isArray(laudoCompleto.implementos)
          ? laudoCompleto.implementos[0] || null
          : laudoCompleto.implementos,
        veiculo: Array.isArray(laudoCompleto.veiculos)
          ? laudoCompleto.veiculos[0] || null
          : laudoCompleto.veiculos,
        caracteristicas: Array.isArray(laudoCompleto.caracteristicas_veiculo)
          ? laudoCompleto.caracteristicas_veiculo[0] || null
          : laudoCompleto.caracteristicas_veiculo,
        itens_inspecao: laudoCompleto.itens_inspecao || [],
        fotos: laudoCompleto.fotos_laudo || [],
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
          <p className="mt-3 text-sm text-gray-500">Criando laudo...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 rounded-lg text-center">
        <p className="text-red-600 font-medium">{erro}</p>
        <button
          onClick={criarLaudo}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!laudo) return null;

  const EtapaComponent = ETAPA_COMPONENTS[etapaAtual];

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Novo Laudo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Rascunho salvo automaticamente
        </p>
      </div>

      {/* Stepper */}
      <WizardStepper />

      {/* Conteúdo da etapa */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <EtapaComponent />
      </div>

      {/* Navegação */}
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
              onClick={() => router.push("/laudos/rascunhos")}
              className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
            >
              Voltar aos Rascunhos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

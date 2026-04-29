import { create } from "zustand";
import type { LaudoCompleto } from "@/types/database";

interface WizardState {
  etapaAtual: number;
  laudo: LaudoCompleto | null;
  salvando: boolean;
  carregando: boolean;

  setEtapa: (etapa: number) => void;
  proximaEtapa: () => void;
  etapaAnterior: () => void;
  setLaudo: (laudo: LaudoCompleto) => void;
  setSalvando: (salvando: boolean) => void;
  setCarregando: (carregando: boolean) => void;
  atualizarSecao: (secao: string, dados: unknown) => void;
  /** Limpa o wizard — deve ser chamado ao iniciar um novo laudo */
  resetWizard: () => void;
}

export const useWizardStore = create<WizardState>()(
  (set, get) => ({
    etapaAtual: 0,
    laudo: null,
    salvando: false,
    carregando: false,

    setEtapa: (etapa) => set({ etapaAtual: etapa }),

    proximaEtapa: () => {
      const { etapaAtual } = get();
      if (etapaAtual < 6) set({ etapaAtual: etapaAtual + 1 });
    },

    etapaAnterior: () => {
      const { etapaAtual } = get();
      if (etapaAtual > 0) set({ etapaAtual: etapaAtual - 1 });
    },

    setLaudo: (laudo) => set({ laudo }),
    setSalvando: (salvando) => set({ salvando }),
    setCarregando: (carregando) => set({ carregando }),

    atualizarSecao: (secao, dados) => {
      const { laudo } = get();
      if (!laudo) return;
      set({ laudo: { ...laudo, [secao]: dados } });
    },

    resetWizard: () => set({ laudo: null, etapaAtual: 0, salvando: false }),
  })
);

// Nomes das etapas para o stepper
export const ETAPAS_WIZARD = [
  "Proprietário",
  "Implemento",
  "Veículo",
  "Características",
  "Inspeções",
  "Fotos",
  "Conclusão",
] as const;

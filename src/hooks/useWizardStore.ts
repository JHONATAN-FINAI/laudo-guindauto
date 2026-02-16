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
  atualizarSecao: (secao: string, dados: any) => void;
}

export const useWizardStore = create<WizardState>()(
  (set: (partial: Partial<WizardState>) => void, get: () => WizardState) => ({
    etapaAtual: 0,
    laudo: null,
    salvando: false,
    carregando: false,

    setEtapa: (etapa: number) => set({ etapaAtual: etapa }),

    proximaEtapa: () => {
      const { etapaAtual } = get();
      if (etapaAtual < 6) set({ etapaAtual: etapaAtual + 1 });
    },

    etapaAnterior: () => {
      const { etapaAtual } = get();
      if (etapaAtual > 0) set({ etapaAtual: etapaAtual - 1 });
    },

    setLaudo: (laudo: LaudoCompleto) => set({ laudo }),
    setSalvando: (salvando: boolean) => set({ salvando }),
    setCarregando: (carregando: boolean) => set({ carregando }),

    atualizarSecao: (secao: string, dados: any) => {
      const { laudo } = get();
      if (!laudo) return;
      set({ laudo: { ...laudo, [secao]: dados } });
    },
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

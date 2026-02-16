"use client";

import { cn } from "@/lib/utils/cn";
import { useWizardStore, ETAPAS_WIZARD } from "@/hooks/useWizardStore";
import { Check } from "lucide-react";

export function WizardStepper() {
  const { etapaAtual, setEtapa } = useWizardStore();

  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex min-w-max items-center gap-1">
        {ETAPAS_WIZARD.map((nome, index) => {
          const completa = index < etapaAtual;
          const ativa = index === etapaAtual;

          return (
            <button
              key={nome}
              onClick={() => setEtapa(index)}
              className="flex items-center gap-1.5"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  completa && "bg-green-500 text-white",
                  ativa && "bg-primary-600 text-white",
                  !completa && !ativa && "bg-gray-200 text-gray-500"
                )}
              >
                {completa ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  ativa ? "text-primary-600" : "text-gray-500"
                )}
              >
                {nome}
              </span>
              {index < ETAPAS_WIZARD.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px w-6 sm:w-10",
                    completa ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

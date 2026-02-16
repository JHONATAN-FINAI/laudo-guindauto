"use client";

import { useState } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";

const CAMPOS = [
  { key: "distancia_entre_eixos", label: "Distância entre Eixos" },
  { key: "comprimento_total", label: "Comprimento Total" },
  { key: "comprimento_carroceria", label: "Comprimento da Carroceria" },
  { key: "largura", label: "Largura" },
  { key: "altura", label: "Altura" },
  { key: "qtd_eixos_rodas", label: "Qtd Eixos/Rodas" },
  { key: "eixos_motrizes", label: "Eixos Motrizes" },
  { key: "pbtc", label: "PBTC" },
  { key: "cmt", label: "CMT" },
] as const;

export function EtapaCaracteristicas() {
  const { laudo, setSalvando, proximaEtapa, etapaAnterior, atualizarSecao } = useWizardStore();
  const carac = laudo?.caracteristicas;

  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(CAMPOS.map((c) => [c.key, (carac as any)?.[c.key] || ""]))
  );

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarEAvancar() {
    setSalvando(true);
    try {
      const res = await fetch(`/api/laudos/${laudo!.id}/caracteristicas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const dados = await res.json();
        atualizarSecao("caracteristicas", dados);
        proximaEtapa();
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Características Atuais do Veículo
      </h2>
      <p className="text-sm text-gray-500">
        Medições realizadas in loco durante a inspeção.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <div key={campo.key}>
            <label className="label-field">{campo.label}</label>
            <input
              type="text"
              value={form[campo.key]}
              onChange={(e) => handleChange(campo.key, e.target.value)}
              className="input-field"
              placeholder="Ex: 1940 kg"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between">
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

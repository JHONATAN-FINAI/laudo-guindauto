"use client";

import { useState } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";

const CAMPOS = [
  { key: "tipo", label: "Tipo do Veículo" },
  { key: "placa", label: "Placa" },
  { key: "ano_modelo", label: "Ano/Modelo" },
  { key: "chassi", label: "Chassi" },
  { key: "renavan", label: "Renavan" },
  { key: "marca_modelo", label: "Marca/Modelo" },
  { key: "num_eixos", label: "Nº de Eixos" },
  { key: "pbtc", label: "PBTC" },
  { key: "hodometro", label: "Hodômetro" },
] as const;

export function EtapaVeiculo() {
  const { laudo, setSalvando, proximaEtapa, etapaAnterior, atualizarSecao } = useWizardStore();
  const veic = laudo?.veiculo;

  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(CAMPOS.map((c) => [c.key, (veic as any)?.[c.key] || ""]))
  );

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarEAvancar() {
    setSalvando(true);
    try {
      const res = await fetch(`/api/laudos/${laudo!.id}/veiculo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const dados = await res.json();
        atualizarSecao("veiculo", dados);
        proximaEtapa();
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Dados do Veículo Base
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <div key={campo.key}>
            <label className="label-field">{campo.label}</label>
            <input
              type="text"
              value={form[campo.key]}
              onChange={(e) => handleChange(campo.key, e.target.value)}
              className="input-field"
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

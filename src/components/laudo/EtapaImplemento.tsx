"use client";

import { useState } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";

const CAMPOS = [
  { key: "fabricante", label: "Fabricante" },
  { key: "modelo", label: "Modelo" },
  { key: "numero_serie", label: "Número de Série" },
  { key: "ano_fabricacao", label: "Ano de Fabricação" },
  { key: "peso", label: "Peso" },
  { key: "pressao_trabalho", label: "Pressão de Trabalho" },
  { key: "capacidade_carga", label: "Capacidade de Carga" },
  { key: "alcance_horizontal", label: "Alcance Horizontal" },
  { key: "alcance_vertical", label: "Alcance Vertical" },
  { key: "angulo_giro", label: "Ângulo de Giro" },
  { key: "horimetro", label: "Horímetro" },
] as const;

export function EtapaImplemento() {
  const { laudo, setSalvando, proximaEtapa, etapaAnterior, atualizarSecao } = useWizardStore();
  const impl = laudo?.implemento;

  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(CAMPOS.map((c) => [c.key, (impl as any)?.[c.key] || ""]))
  );

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarEAvancar() {
    setSalvando(true);
    try {
      const res = await fetch(`/api/laudos/${laudo!.id}/implemento`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const dados = await res.json();
        atualizarSecao("implemento", dados);
        proximaEtapa();
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Dados do Implemento (Guindauto)
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

"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

const ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export default function ConfiguracoesPage() {
  const [creaNumero, setCreaNumero] = useState("");
  const [creaEstado, setCreaEstado] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/me/crea")
      .then((r) => r.json())
      .then((data) => {
        setCreaNumero(data.crea_numero || "");
        setCreaEstado(data.crea_estado || "");
      })
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);

    try {
      const res = await fetch("/api/users/me/crea", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crea_numero: creaNumero, crea_estado: creaEstado }),
      });

      if (res.ok) {
        setMensagem({ tipo: "sucesso", texto: "CREA salvo com sucesso." });
      } else {
        setMensagem({ tipo: "erro", texto: "Erro ao salvar CREA." });
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>

      <form onSubmit={salvar} className="card space-y-4">
        <h2 className="text-base font-medium text-gray-900">Dados do CREA</h2>

        <div>
          <label className="label-field">Número do CREA</label>
          <input
            type="text"
            value={creaNumero}
            onChange={(e) => setCreaNumero(e.target.value)}
            className="input-field"
            placeholder="Ex: 123456"
            required
          />
        </div>

        <div>
          <label className="label-field">Estado (UF)</label>
          <select
            value={creaEstado}
            onChange={(e) => setCreaEstado(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Selecione...</option>
            {ESTADOS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>

        {mensagem && (
          <div className={mensagem.tipo === "sucesso"
            ? "rounded-lg bg-green-50 p-3 text-sm text-green-700"
            : "rounded-lg bg-red-50 p-3 text-sm text-red-700"
          }>
            {mensagem.texto}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={salvando}>
          {salvando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar CREA
        </button>
      </form>
    </div>
  );
}

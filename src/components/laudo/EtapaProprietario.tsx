"use client";

import { useState } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";
import { formatarCnpj, limparCnpj, validarCnpj } from "@/lib/utils/cnpj";
import { Search, Loader2 } from "lucide-react";

export function EtapaProprietario() {
  const { laudo, setSalvando, proximaEtapa, atualizarSecao } = useWizardStore();
  const prop = laudo?.proprietario;
  const [buscando, setBuscando] = useState(false);
  const [erroCnpj, setErroCnpj] = useState("");

  const [form, setForm] = useState({
    cnpj: prop?.cnpj || "",
    razao_social: prop?.razao_social || "",
    endereco: prop?.endereco || "",
    email: prop?.email || "",
    telefone: prop?.telefone || "",
  });

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function buscarCnpj() {
    const cnpjLimpo = limparCnpj(form.cnpj);
    if (!validarCnpj(cnpjLimpo)) {
      setErroCnpj("CNPJ inválido");
      return;
    }

    setErroCnpj("");
    setBuscando(true);

    try {
      const res = await fetch(`/api/cnpj/${cnpjLimpo}`);
      if (!res.ok) {
        setErroCnpj("CNPJ não encontrado");
        return;
      }
      const dados = await res.json();
      setForm((prev) => ({
        ...prev,
        cnpj: dados.cnpj,
        razao_social: dados.razao_social || prev.razao_social,
        endereco: dados.endereco || prev.endereco,
        email: dados.email || prev.email,
        telefone: dados.telefone || prev.telefone,
      }));
    } catch {
      setErroCnpj("Erro na consulta");
    } finally {
      setBuscando(false);
    }
  }

  async function salvarEAvancar() {
    setSalvando(true);
    try {
      const res = await fetch(`/api/laudos/${laudo!.id}/proprietario`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const dados = await res.json();
        atualizarSecao("proprietario", dados);
        proximaEtapa();
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Dados do Proprietário
      </h2>

      <div>
        <label className="label-field">CNPJ</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formatarCnpj(form.cnpj)}
            onChange={(e) => handleChange("cnpj", limparCnpj(e.target.value))}
            className="input-field flex-1"
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
          <button
            onClick={buscarCnpj}
            disabled={buscando}
            className="btn-secondary shrink-0"
          >
            {buscando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>
        {erroCnpj && <p className="mt-1 text-sm text-red-600">{erroCnpj}</p>}
      </div>

      <div>
        <label className="label-field">Razão Social</label>
        <input
          type="text"
          value={form.razao_social}
          onChange={(e) => handleChange("razao_social", e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="label-field">Endereço</label>
        <input
          type="text"
          value={form.endereco}
          onChange={(e) => handleChange("endereco", e.target.value)}
          className="input-field"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field">Telefone</label>
          <input
            type="text"
            value={form.telefone}
            onChange={(e) => handleChange("telefone", e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={salvarEAvancar} className="btn-primary">
          Salvar e Avançar
        </button>
      </div>
    </div>
  );
}

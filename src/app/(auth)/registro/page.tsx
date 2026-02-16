"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegistroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    // Cria conta via API
    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    });

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    // Faz login automático após registro
    const result = await signIn("credentials", {
      email,
      password: senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("Conta criada, mas falha no login. Tente entrar manualmente.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="card">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registre-se para usar o sistema
        </p>
      </div>

      <form onSubmit={handleRegistro} className="space-y-4">
        <div>
          <label htmlFor="nome" className="label-field">
            Nome completo
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-field"
            placeholder="Seu nome completo"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="label-field">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="senha" className="label-field">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="input-field"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
        </div>

        {erro && (
          <p className="text-sm text-red-600">{erro}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

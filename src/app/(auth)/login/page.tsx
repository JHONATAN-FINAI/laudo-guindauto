"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password: senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="card">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Inspeção Guindauto
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Acesse sua conta para continuar
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="Sua senha"
            required
          />
        </div>

        {erro && (
          <p className="text-sm text-red-600">{erro}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <Link href="/registro" className="text-primary-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

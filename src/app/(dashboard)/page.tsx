import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { laudos, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { FilePlus, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Contadores
  const [[rascunhos], [finalizados]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(laudos).where(and(eq(laudos.user_id, userId), eq(laudos.status, "rascunho"))),
    db.select({ count: sql<number>`count(*)::int` }).from(laudos).where(and(eq(laudos.user_id, userId), eq(laudos.status, "finalizado"))),
  ]);

  // Busca CREA do usuário
  const [perfil] = await db.select({ crea_numero: users.crea_numero }).from(users).where(eq(users.id, userId)).limit(1);

  const cards = [
    {
      label: "Rascunhos",
      count: rascunhos.count ?? 0,
      icon: FileText,
      href: "/laudos/rascunhos",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Finalizados",
      count: finalizados.count ?? 0,
      icon: CheckCircle,
      href: "/laudos/finalizados",
      color: "text-green-600 bg-green-50",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {session.user.name || "Inspetor"}
          </h1>
          <p className="text-sm text-gray-500">
            Gerencie seus laudos de inspeção
          </p>
        </div>
        <Link href="/laudos/novo" className="btn-primary">
          <FilePlus className="mr-2 h-4 w-4" />
          Novo Laudo
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.count}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!perfil?.crea_numero && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              CREA não cadastrado
            </p>
            <p className="text-sm text-amber-700">
              Configure seu CREA nas{" "}
              <Link href="/configuracoes" className="underline">
                configurações
              </Link>{" "}
              para poder finalizar laudos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

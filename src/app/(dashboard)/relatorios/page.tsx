import { db } from "@/lib/db";
import { laudos } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { count, desc, eq, and, gte, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, Calendar } from "lucide-react";

export const metadata = {
  title: "Relatórios | Guindauto",
  description: "Visão geral e estatísticas dos laudos.",
};

async function getStats(userId: string) {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    [{ total }],
    [{ finalizados }],
    [{ rascunhos }],
    [{ esteMes }],
    recentes,
  ] = await Promise.all([
    db.select({ total: count() }).from(laudos).where(eq(laudos.user_id, userId)),
    db.select({ finalizados: count() }).from(laudos).where(and(eq(laudos.user_id, userId), eq(laudos.status, "finalizado"))),
    db.select({ rascunhos: count() }).from(laudos).where(and(eq(laudos.user_id, userId), eq(laudos.status, "rascunho"))),
    db.select({ esteMes: count() }).from(laudos).where(and(eq(laudos.user_id, userId), gte(laudos.created_at, inicioMes))),
    db.select().from(laudos).where(eq(laudos.user_id, userId)).orderBy(desc(laudos.updated_at)).limit(5),
  ]);

  return { total, finalizados, rascunhos, esteMes, recentes };
}

export default async function RelatoriosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getStats(session.user.id);

  const cards = [
    { label: "Total de Laudos", value: stats.total, icon: FileText, cor: "text-blue-600 bg-blue-50" },
    { label: "Finalizados", value: stats.finalizados, icon: CheckCircle, cor: "text-green-600 bg-green-50" },
    { label: "Rascunhos", value: stats.rascunhos, icon: Clock, cor: "text-orange-600 bg-orange-50" },
    { label: "Este Mês", value: stats.esteMes, icon: Calendar, cor: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatórios</h1>
        <p className="mt-2 text-gray-600">Visão geral da sua produtividade e laudos recentes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, cor }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${cor.split(" ")[0]}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Atividade Recente</h2>

        {stats.recentes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">Nenhum laudo encontrado.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white">
            <ul className="divide-y divide-gray-200">
              {stats.recentes.map((laudo) => (
                <li key={laudo.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {laudo.numero_inspecao || "Sem número"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(laudo.updated_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        laudo.status === "finalizado"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {laudo.status === "finalizado" ? "Finalizado" : "Rascunho"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

import { db } from "@/lib/db";
import { laudos } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { count, desc, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, Calendar } from "lucide-react";

export const metadata = {
    title: "Relatórios | Guindauto",
    description: "Visão geral e estatísticas dos laudos.",
};

async function getStats(userId: string) {
    // Total de laudos do usuário
    const [totalLaudos] = await db
        .select({ count: count() })
        .from(laudos)
        .where(eq(laudos.user_id, userId));

    // Laudos finalizados
    const [finalizados] = await db
        .select({ count: count() })
        .from(laudos)
        .where(eq(laudos.status, "finalizado"))
    // .where(eq(laudos.user_id, userId)); // Add this if you want to filter by user as well for all stats

    // Rascunhos
    const [rascunhos] = await db
        .select({ count: count() })
        .from(laudos)
        .where(eq(laudos.status, "rascunho"))
    //.where(eq(laudos.user_id, userId));

    // Recentes (últimos 5)
    const recentes = await db
        .select()
        .from(laudos)
        .orderBy(desc(laudos.updated_at))
        .limit(5);
    // .where(eq(laudos.user_id, userId));

    return {
        total: totalLaudos.count,
        finalizados: finalizados.count,
        rascunhos: rascunhos.count,
        recentes,
    };
}

export default async function RelatoriosPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login"); // Adjust based on your auth setup
    }

    const stats = await getStats(session.user.id);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Relatórios
                </h1>
                <p className="mt-2 text-gray-600">
                    Visão geral da sua produtividade e laudos recentes.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Laudos</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Registrados no sistema
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.finalizados}</div>
                        <p className="text-xs text-muted-foreground">
                            Laudos concluídos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rascunhos}</div>
                        <p className="text-xs text-muted-foreground">
                            Em andamento
                        </p>
                    </CardContent>
                </Card>

                {/* Placeholder for "This Month" if we want to implement date filtering later */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">
                            Laudos criados este mês
                        </p>
                    </CardContent>
                </Card>
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
                                                {laudo.updated_at ? new Date(laudo.updated_at).toLocaleDateString() : "Data desconhecida"}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${laudo.status === "finalizado"
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

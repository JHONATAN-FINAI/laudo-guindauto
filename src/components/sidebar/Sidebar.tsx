"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import {
  ClipboardList,
  FilePlus,
  FileText,
  CheckCircle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { href: "/", label: "Início", icon: ClipboardList },
  { href: "/laudos/novo", label: "Novo Laudo", icon: FilePlus },
  { href: "/laudos/rascunhos", label: "Rascunhos", icon: FileText },
  { href: "/laudos/finalizados", label: "Finalizados", icon: CheckCircle },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setAberto(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-white p-2 shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay mobile */}
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-bold text-gray-900">Guindauto</h2>
          <button onClick={() => setAberto(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

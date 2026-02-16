import { Sidebar } from "@/components/sidebar/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}

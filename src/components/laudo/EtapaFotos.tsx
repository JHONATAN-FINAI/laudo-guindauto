"use client";

import { useState } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";
import { Camera, X, Loader2 } from "lucide-react";
import type { TipoFoto } from "@/types/database";

const FOTOS_OBRIGATORIAS: { tipo: TipoFoto; label: string }[] = [
  { tipo: "capa", label: "Foto de Capa" },
  { tipo: "placa", label: "Placa do Veículo" },
  { tipo: "guindaste", label: "Guindaste (visão geral)" },
  { tipo: "alavancas", label: "Alavancas de Comando" },
  { tipo: "plaqueta", label: "Plaqueta de Identificação" },
  { tipo: "grafico_cargas", label: "Gráfico de Cargas" },
  { tipo: "mangueiras", label: "Mangueiras Hidráulicas" },
  { tipo: "estabilizadores", label: "Estabilizadores (Patolas)" },
  { tipo: "horimetro", label: "Horímetro" },
];

const FOTOS_EXTRAS: { tipo: TipoFoto; label: string }[] = [
  { tipo: "extra_1", label: "Extra 1" },
  { tipo: "extra_2", label: "Extra 2" },
  { tipo: "extra_3", label: "Extra 3" },
  { tipo: "extra_4", label: "Extra 4" },
  { tipo: "extra_5", label: "Extra 5" },
];

function SlotFoto({
  tipo,
  label,
  fotoUrl,
  laudoId,
  onUpload,
  onRemove,
}: {
  tipo: TipoFoto;
  label: string;
  fotoUrl: string | null;
  laudoId: string;
  onUpload: (tipo: TipoFoto, url: string) => void;
  onRemove: (tipo: TipoFoto) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Compressão básica via canvas
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      await new Promise<void>((resolve) => {
        img.onload = () => {
          const maxW = 1600;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.src = URL.createObjectURL(file);
      });

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
      );

      // Upload via API route (que usa Vercel Blob)
      const formData = new FormData();
      formData.append("arquivo", new File([blob], `${tipo}.jpg`, { type: "image/jpeg" }));
      formData.append("tipo", tipo);

      const res = await fetch(`/api/laudos/${laudoId}/fotos`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUpload(tipo, data.url || data.storage_url);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
      {fotoUrl ? (
        <>
          <img src={fotoUrl} alt={label} className="h-full w-full object-cover" />
          <button
            onClick={() => onRemove(tipo)}
            className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <Camera className="h-6 w-6 text-gray-400" />
          )}
          <span className="text-center text-xs text-gray-500">{label}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="sr-only"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}

export function EtapaFotos() {
  const { laudo, proximaEtapa, etapaAnterior } = useWizardStore();
  const [fotos, setFotos] = useState<Record<string, string>>(
    Object.fromEntries(
      (laudo?.fotos || []).map((f: { tipo: string; storage_url?: string; url?: string }) => [
        f.tipo,
        f.storage_url || f.url || "",
      ])
    )
  );

  function handleUpload(tipo: TipoFoto, url: string) {
    setFotos((prev) => ({ ...prev, [tipo]: url }));
  }

  function handleRemove(tipo: TipoFoto) {
    setFotos((prev) => {
      const next = { ...prev };
      delete next[tipo];
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Relatório Fotográfico
      </h2>

      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Fotos Obrigatórias
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FOTOS_OBRIGATORIAS.map((slot) => (
            <SlotFoto
              key={slot.tipo}
              tipo={slot.tipo}
              label={slot.label}
              fotoUrl={fotos[slot.tipo] || null}
              laudoId={laudo!.id}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Fotos Extras (opcional)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FOTOS_EXTRAS.map((slot) => (
            <SlotFoto
              key={slot.tipo}
              tipo={slot.tipo}
              label={slot.label}
              fotoUrl={fotos[slot.tipo] || null}
              laudoId={laudo!.id}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={etapaAnterior} className="btn-secondary">
          Voltar
        </button>
        <button onClick={proximaEtapa} className="btn-primary">
          Avançar
        </button>
      </div>
    </div>
  );
}

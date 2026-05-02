"use client";

import { useState } from "react";
import { useWizardStore } from "@/hooks/useWizardStore";
import { Camera, X, Loader2 } from "lucide-react";
import type { TipoFoto } from "@/types/database";
import { FOTOS_CONFIG } from "@/lib/laudos/constants";

const FOTOS_OBRIGATORIAS = FOTOS_CONFIG.filter((f) => f.obrigatorio);
const FOTOS_EXTRAS = FOTOS_CONFIG.filter((f) => !f.obrigatorio);

interface FotoState {
  url: string;
  id?: string; // id do registro no banco para poder deletar
}

function SlotFoto({
  tipo,
  label,
  foto,
  laudoId,
  onUpload,
  onRemove,
}: {
  tipo: TipoFoto;
  label: string;
  foto: FotoState | null;
  laudoId: string;
  onUpload: (tipo: TipoFoto, foto: FotoState) => void;
  onRemove: (tipo: TipoFoto, fotoId?: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limpa o input para permitir reenvio do mesmo arquivo
    e.target.value = "";

    setUploading(true);
    setErro(null);

    try {
      // Compressão via canvas — reduz para max 1600px, 82% qualidade
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Erro ao carregar imagem"));
        img.src = URL.createObjectURL(file);
      });

      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Falha na compressão"))),
          "image/jpeg",
          0.82
        )
      );

      const formData = new FormData();
      formData.append("arquivo", new File([blob], `${tipo}.jpg`, { type: "image/jpeg" }));
      formData.append("tipo", tipo);

      const res = await fetch(`/api/laudos/${laudoId}/fotos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      onUpload(tipo, { url: data.url || data.storage_url, id: data.id });
    } catch (err: any) {
      setErro(err?.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    onRemove(tipo, foto?.id);
    // Deleta do banco em background (não bloqueia a UI)
    if (foto?.id) {
      fetch(`/api/laudos/${laudoId}/fotos?fotoId=${foto.id}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
        {foto?.url ? (
          <>
            <img
              src={foto.url}
              alt={label}
              className="h-full w-full object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
              title="Remover foto"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs text-gray-400">Enviando...</span>
              </>
            ) : (
              <>
                <Camera className="h-6 w-6 text-gray-400" />
                <span className="text-xs text-gray-400">Toque para adicionar</span>
              </>
            )}
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

      <p className="text-center text-xs text-gray-500 leading-tight">{label}</p>

      {erro && (
        <p className="text-center text-xs text-red-500 leading-tight">{erro}</p>
      )}
    </div>
  );
}

export function EtapaFotos() {
  const { laudo, proximaEtapa, etapaAnterior } = useWizardStore();

  // Estado com url + id para cada tipo de foto
  const [fotos, setFotos] = useState<Record<string, FotoState>>(() =>
    Object.fromEntries(
      (laudo?.fotos || [])
        .filter((f: any) => f.storage_url || f.url)
        .map((f: any) => [
          f.tipo,
          { url: f.storage_url || f.url, id: f.id },
        ])
    )
  );

  const obrigatoriasConcluidas = FOTOS_OBRIGATORIAS.filter(
    (f) => fotos[f.tipo]?.url
  ).length;

  function handleUpload(tipo: TipoFoto, novaFoto: FotoState) {
    setFotos((prev) => ({ ...prev, [tipo]: novaFoto }));
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Relatório Fotográfico</h2>
        <span className="text-sm text-gray-500">
          {obrigatoriasConcluidas}/{FOTOS_OBRIGATORIAS.length} obrigatórias
        </span>
      </div>

      {/* Progresso */}
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{
            width: `${(obrigatoriasConcluidas / FOTOS_OBRIGATORIAS.length) * 100}%`,
          }}
        />
      </div>

      {/* Fotos obrigatórias */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Fotos Obrigatórias
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FOTOS_OBRIGATORIAS.map((slot) => (
            <SlotFoto
              key={slot.tipo}
              tipo={slot.tipo as TipoFoto}
              label={slot.label}
              foto={fotos[slot.tipo] || null}
              laudoId={laudo!.id}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      {/* Fotos extras */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Fotos Extras (opcional)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FOTOS_EXTRAS.map((slot) => (
            <SlotFoto
              key={slot.tipo}
              tipo={slot.tipo as TipoFoto}
              label={slot.label}
              foto={fotos[slot.tipo] || null}
              laudoId={laudo!.id}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
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

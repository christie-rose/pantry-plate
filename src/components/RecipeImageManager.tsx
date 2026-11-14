"use client";

import { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiSparklingLine, RiUpload2Line } from "@remixicon/react";
import { ActionsMenu, Button, MenuItem, RecipeImage } from "@/ui";

/** Shrinks a large photo in the browser before upload (phone photos can be 10 MB). Falls back to the original. */
async function shrinkForUpload(file: File): Promise<File> {
  if (file.size < 1_500_000) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

type Status = { version: number | null; generating: boolean; error: string | null };

/**
 * The photo at the top of a recipe, with everything needed to change it: upload your own, have AI make one from
 * the recipe, or remove it. Works the same whether the current photo was uploaded or made by AI.
 */
export function RecipeImageManager({
  recipeId,
  title,
  initialVersion,
  expectAiImage,
}: {
  recipeId: string;
  title: string;
  initialVersion: number | null;
  /** True for a recipe written by AI that has no photo yet: one is being made in the background. */
  expectAiImage: boolean;
}) {
  const [version, setVersion] = useState<number | null>(initialVersion);
  const [generating, setGenerating] = useState(expectAiImage && initialVersion === null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // While a photo is being made, ask the server every few seconds whether it is done.
  useEffect(() => {
    if (!generating) return;
    let stopped = false;
    let attempts = 0;
    async function check() {
      attempts += 1;
      try {
        const res = await fetch(`/api/recipes/${recipeId}/image/status`);
        const status = (await res.json()) as Status;
        if (stopped) return;
        if (!status.generating) {
          setGenerating(false);
          if (status.version !== null) setVersion(status.version);
          if (status.error) setError(status.error);
          else if (status.version === null && attempts > 2) setError("A photo could not be made. You can try again.");
        }
      } catch {
        // keep trying
      }
    }
    check();
    const timer = setInterval(() => {
      if (attempts >= 40) {
        setGenerating(false);
        return;
      }
      check();
    }, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [generating, recipeId]);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.set("file", await shrinkForUpload(file));
    const res = await fetch(`/api/recipes/${recipeId}/image`, { method: "PUT", body: form }).catch(() => null);
    setUploading(false);
    if (res?.ok) {
      setVersion(Date.now());
    } else {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "The picture could not be uploaded. Try again.");
    }
  }

  async function generate() {
    setError(null);
    const res = await fetch(`/api/recipes/${recipeId}/image/generate`, { method: "POST" }).catch(() => null);
    if (res?.ok) {
      setGenerating(true);
    } else {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "The picture could not be made. Try again.");
    }
  }

  async function remove() {
    setError(null);
    await fetch(`/api/recipes/${recipeId}/image`, { method: "DELETE" }).catch(() => null);
    setVersion(null);
  }

  const hasImage = version !== null;
  const busy = generating || uploading;
  const src = hasImage ? `/api/recipes/${recipeId}/image?v=${version}` : null;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Upload a photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />

      <RecipeImage
        src={src}
        alt={`${title}`}
        busy={busy}
        size="hero"
        action={
          hasImage ? (
            <ActionsMenu>
              {(close) => (
                <>
                  <MenuItem
                    tone="ink"
                    icon={<RiUpload2Line size={16} aria-hidden />}
                    onClick={() => {
                      close();
                      fileRef.current?.click();
                    }}
                  >
                    Upload your own photo
                  </MenuItem>
                  <MenuItem
                    tone="ink"
                    icon={<RiSparklingLine size={16} aria-hidden />}
                    disabled={busy}
                    onClick={() => {
                      close();
                      generate();
                    }}
                  >
                    Make a new one with AI
                  </MenuItem>
                  <MenuItem
                    tone="danger"
                    icon={<RiCloseLine size={16} aria-hidden />}
                    onClick={() => {
                      close();
                      remove();
                    }}
                  >
                    Remove photo
                  </MenuItem>
                </>
              )}
            </ActionsMenu>
          ) : undefined
        }
      />

      {!hasImage && !busy && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <RiUpload2Line size={18} aria-hidden />
            Upload a photo
          </Button>
          <Button variant="secondary" onClick={generate}>
            <RiSparklingLine size={18} aria-hidden />
            Make one with AI
          </Button>
        </div>
      )}
      {hasImage && generating && <p className="text-sm text-cocoa">Making a new photo… the current one stays until it is ready.</p>}
      {uploading && <p className="text-sm text-cocoa">Uploading…</p>}
      {error && (
        <p role="status" className="text-sm text-brick">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Heading2, List, Quote, Link2, ImageUp, Loader2 } from "lucide-react";
import { supabasePublic } from "@/lib/supabase";
import { processImageForUpload } from "@/lib/imageProcessing";

export default function MarkdownEditorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function wrapSelection(before: string, after = before, placeholder = "") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function handleLink() {
    const el = textareaRef.current;
    const selected = el ? value.slice(el.selectionStart, el.selectionEnd) : "";
    const url = window.prompt(
      "Bağlantı adresi girin (iç link için /hizmetlerimiz/... , dış link için https://...)"
    );
    if (!url) return;
    wrapSelection("[", `](${url})`, selected || "bağlantı metni");
  }

  async function handleImageFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const processed = await processImageForUpload(file);
      const urlRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: processed.name }),
      });
      const urlBody = await urlRes.json().catch(() => ({}));
      if (!urlRes.ok) throw new Error(urlBody.error ?? "Yükleme başlatılamadı.");

      const { error: uploadError } = await supabasePublic.storage
        .from("media")
        .uploadToSignedUrl(urlBody.path, urlBody.token, processed);
      if (uploadError) throw uploadError;

      insertAtCursor(`\n\n![${file.name.replace(/\.[^.]+$/, "")}](${urlBody.publicUrl})\n\n`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-line bg-paper-raised p-1.5">
        <ToolbarButton label="Kalın" onClick={() => wrapSelection("**", "**", "kalın metin")}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton label="İtalik" onClick={() => wrapSelection("*", "*", "italik metin")}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton label="Alt başlık" onClick={() => wrapSelection("\n## ", "\n", "Alt Başlık")}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton label="Liste" onClick={() => wrapSelection("\n- ", "", "liste öğesi")}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton label="Alıntı" onClick={() => wrapSelection("\n> ", "", "alıntı metni")}>
          <Quote size={15} />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-line" />
        <ToolbarButton label="Bağlantı ekle (iç/dış link)" onClick={handleLink}>
          <Link2 size={15} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
        <ToolbarButton label="Görsel ekle" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageUp size={15} />}
        </ToolbarButton>
      </div>
      <textarea
        ref={textareaRef}
        required
        rows={16}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input rounded-t-none font-mono text-[13.5px]"
      />
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}

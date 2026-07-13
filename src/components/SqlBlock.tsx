"use client";
import { useState } from "react";

export function SqlBlock({ name, title, page, blurb, code }: { name: string; title: string; page: string; blurb: string; code: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{open ? "▾" : "▸"}</span>
            <code style={{ fontSize: 13 }}>{name}</code>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>{title}</span>
            <span className="chip">{page}</span>
          </span>
          <span className="caption" style={{ paddingLeft: 20 }}>{blurb}</span>
        </span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="pill"
            onClick={(e) => { e.stopPropagation(); copy(); }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </span>
      </div>
      {open ? <pre className="sql">{code}</pre> : null}
    </div>
  );
}

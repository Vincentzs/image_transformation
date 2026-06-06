import { useState } from "react";
import type { ProcessedImage } from "../types.js";

interface Props {
  image: ProcessedImage;
}

export function ResultCard({ image }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "1rem", marginTop: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Result</h2>
      <img
        src={image.url}
        alt="Processed result"
        style={{ maxWidth: "100%", borderRadius: 8, background: "#eef0f3" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          readOnly
          value={image.url}
          aria-label="Image URL"
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
        />
        <button onClick={copy} style={{ padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}>
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
    </div>
  );
}

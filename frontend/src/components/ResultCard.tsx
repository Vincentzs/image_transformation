import type { ProcessedImage } from "../types.js";
import { CopyUrlButton } from "./CopyUrlButton.js";

interface Props {
  image: ProcessedImage;
}

export function ResultCard({ image }: Props) {
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
        <CopyUrlButton url={image.url} />
      </div>
    </div>
  );
}

import type { ProcessedImage } from "../types.js";

interface Props {
  images: ProcessedImage[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function Gallery({ images, onDelete, deletingId }: Props) {
  if (images.length === 0) {
    return <p style={{ color: "#6b7280" }}>No images yet. Upload one to get started.</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12,
      }}
    >
      {images.map((img) => (
        <div key={img.id} style={{ background: "#fff", borderRadius: 10, padding: 8 }}>
          <img
            src={img.url}
            alt="Hosted result"
            style={{ width: "100%", height: 120, objectFit: "contain", background: "#eef0f3", borderRadius: 6 }}
          />
          <button
            onClick={() => onDelete(img.id)}
            disabled={deletingId === img.id}
            style={{ marginTop: 8, width: "100%", padding: 6, borderRadius: 6, cursor: "pointer" }}
          >
            {deletingId === img.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}

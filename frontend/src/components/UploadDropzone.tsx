import { useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  disabled: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/webp";

export function UploadDropzone({ onFileSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) onFileSelected(files[0]);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      style={{
        border: `2px dashed ${dragOver ? "#3b82f6" : "#c4c8cf"}`,
        borderRadius: 12,
        padding: "2.5rem",
        textAlign: "center",
        background: dragOver ? "#eef4ff" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Drop an image here or click to upload</p>
      <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: 14 }}>
        PNG, JPEG, or WEBP · max 10 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

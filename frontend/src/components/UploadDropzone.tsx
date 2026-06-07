import { useRef, useState } from "react";
import styles from "./UploadDropzone.module.css";

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

  const className = [styles.zone, dragOver && styles.dragOver, disabled && styles.disabled]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image"
      className={className}
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
    >
      <span className={styles.icon} aria-hidden="true">🪄</span>
      <p className={styles.title}>Drop your image here</p>
      <p className={styles.hint}>or click to browse · PNG, JPEG, WEBP · up to 10 MB</p>
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

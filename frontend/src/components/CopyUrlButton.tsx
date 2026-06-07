import { useState } from "react";
import styles from "./CopyUrlButton.module.css";

interface Props {
  url: string;
  /** Extra class for layout overrides from the parent (e.g. full-width in a card). */
  className?: string;
}

/** Copies a URL to the clipboard and briefly shows a confirmation. */
export function CopyUrlButton({ url, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy image URL"
      className={[styles.button, className].filter(Boolean).join(" ")}
    >
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}

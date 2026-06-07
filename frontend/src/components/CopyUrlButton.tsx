import { useState, type CSSProperties } from "react";

interface Props {
  url: string;
  style?: CSSProperties;
}

/** Copies a URL to the clipboard and briefly shows a confirmation. */
export function CopyUrlButton({ url, style }: Props) {
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
      style={{ padding: "8px 14px", borderRadius: 6, cursor: "pointer", ...style }}
    >
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}

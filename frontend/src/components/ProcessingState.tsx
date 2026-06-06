export function ProcessingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 0" }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          border: "3px solid #c4c8cf",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          display: "inline-block",
        }}
      />
      <span>Removing background and flipping…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

import { colors } from "@/styles/theme";

export function LoadingSplash() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: colors.cream,
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading"
      data-testid="loading-splash"
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: `4px solid ${colors.borderTan}`,
          borderTopColor: colors.sage,
          borderRadius: "50%",
          animation: "splash-spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes splash-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="loading-splash"] div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

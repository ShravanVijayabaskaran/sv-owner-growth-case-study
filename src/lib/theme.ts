// Chart palette — mirrors the CSS tokens in globals.css. Edit here to restyle charts.
export const chart = {
  text: "#0f172a",
  text2: "#475569",
  text3: "#8a94a6",
  grid: "#eceff3",
  axis: "#c8cfd8",
  success: "#059669",
  danger: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
  neutral: "#94a3b8",
  accent: "#4f46e5",
} as const;

export type Tone = "success" | "danger" | "warning" | "info" | "neutral" | "accent";

export const toneColor: Record<Tone, string> = {
  success: chart.success,
  danger: chart.danger,
  warning: chart.warning,
  info: chart.info,
  neutral: chart.neutral,
  accent: chart.accent,
};

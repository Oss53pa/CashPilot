// ============================================================================
// Forecasts — données partagées de l'onglet Prévisions
// ============================================================================

/** Horizons de prévision proposés dans l'UI (libellés « J+N »). */
export type Horizon = "J+7" | "J+30" | "J+90" | "J+365";

/** Ordre d'affichage des horizons. */
export const HORIZONS: Horizon[] = ["J+7", "J+30", "J+90", "J+365"];

/** Nombre de jours correspondant à chaque horizon (aligné sur `Proph3tForecast.horizon`). */
export const HORIZON_DAYS: Record<Horizon, number> = {
  "J+7": 7,
  "J+30": 30,
  "J+90": 90,
  "J+365": 365,
};

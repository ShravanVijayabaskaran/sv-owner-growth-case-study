// Dataset-level facts (from HANDOFF + 00/01). Edit freely.
export const DATASET = {
  rows: 1_514_681,
  brands: 232,
  locations: 295,
  guests: 698_000, // ~698K
  dateStart: "2020-05-18",
  dateEnd: "2025-07-29",
  grain: "1 row = 1 order (ORDER_ID unique)",
  gmvNote: "GMV excludes delivery fee; revenue metrics use GMV > 0.",
};

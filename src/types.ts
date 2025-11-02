/**
 * Type definitions for PvPoke data structures
 */

export interface Pokemon {
  speciesId: string;
  speciesName: string;
  family?: {
    id: string;
  };
}

export interface RankingEntry {
  speciesId: string;
  score: number;
  rank?: number;
}

/**
 * Data structure for the shortcut
 * familyNames: lowercase pokemon name -> family ID
 * rankings: family ID -> formatted display strings for all pokemon in family
 */
export interface ShortcutData {
  familyNames: Record<string, string>; // lowercase name -> family ID
  rankings: Record<string, string>; // family ID -> formatted display text
}

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Pokemon, RankingEntry, ShortcutData } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

interface PokemonWithRankings {
  id: string;
  name: string;
  familyId: string;
  little: number;
  great: number;
  ultra: number;
  master: number;
}

/**
 * Prepare data in a format optimized for iOS Shortcuts dictionary lookups
 * Returns:
 * - familyNames: pokemon name (uppercase) -> family ID
 * - rankings: family ID -> formatted display text for all pokemon in family
 */
export async function prepareData(): Promise<ShortcutData> {
  const dataDir = join(rootDir, "build", "data");
  const distDir = join(rootDir, "dist");

  console.log("Loading Pokemon data...");
  const pokemonData: Pokemon[] = JSON.parse(
    await readFile(join(dataDir, "pokemon.json"), "utf-8")
  );

  console.log("Loading ranking data...");
  const littleLeague: RankingEntry[] = JSON.parse(
    await readFile(join(dataDir, "rankings-500.json"), "utf-8")
  );

  const greatLeague: RankingEntry[] = JSON.parse(
    await readFile(join(dataDir, "rankings-1500.json"), "utf-8")
  );

  const ultraLeague: RankingEntry[] = JSON.parse(
    await readFile(join(dataDir, "rankings-2500.json"), "utf-8")
  );

  const masterLeague: RankingEntry[] = JSON.parse(
    await readFile(join(dataDir, "rankings-10000.json"), "utf-8")
  );

  // Create ranking lookup maps with scores
  const rankingMaps = {
    little: new Map(littleLeague.map((r) => [r.speciesId, r.score])),
    great: new Map(greatLeague.map((r) => [r.speciesId, r.score])),
    ultra: new Map(ultraLeague.map((r) => [r.speciesId, r.score])),
    master: new Map(masterLeague.map((r) => [r.speciesId, r.score])),
  };

  console.log("Processing Pokemon families...");

  // Build list of pokemon with their scores
  const pokemonWithRankings: PokemonWithRankings[] = pokemonData.map(
    (pokemon) => ({
      id: pokemon.speciesId,
      name: pokemon.speciesName,
      familyId: pokemon.family?.id || pokemon.speciesId,
      little: rankingMaps.little.get(pokemon.speciesId) || 0,
      great: rankingMaps.great.get(pokemon.speciesId) || 0,
      ultra: rankingMaps.ultra.get(pokemon.speciesId) || 0,
      master: rankingMaps.master.get(pokemon.speciesId) || 0,
    })
  );

  // Map all Pokemon names to their family ID (even if they have no rankings)
  const familyNames: Record<string, string> = {};
  for (const pokemon of pokemonWithRankings) {
    familyNames[pokemon.name.toUpperCase()] = pokemon.familyId;
  }

  // Group by family (only Pokemon with rankings)
  const familyGroups = new Map<string, PokemonWithRankings[]>();
  for (const pokemon of pokemonWithRankings) {
    if (pokemon.little || pokemon.great || pokemon.ultra || pokemon.master) {
      const family = familyGroups.get(pokemon.familyId) || [];
      family.push(pokemon);
      familyGroups.set(pokemon.familyId, family);
    }
  }

  // Build family rankings data
  const rankings: Record<string, string> = {};

  for (const [familyId, family] of familyGroups) {
    // Build formatted display text for the entire family
    const displayLines: string[] = [];

    for (const pokemon of family) {
      const little = pokemon.little ? pokemon.little.toFixed(1) : "___";
      const great = pokemon.great ? pokemon.great.toFixed(1) : "___";
      const ultra = pokemon.ultra ? pokemon.ultra.toFixed(1) : "___";
      const master = pokemon.master ? pokemon.master.toFixed(1) : "___";
      displayLines.push(
        `${little} ${great} ${ultra} ${master} ${pokemon.name}`
      );
    }

    rankings[familyId] = displayLines.reverse().join("\n");
  }

  console.log(`✓ Processed ${pokemonWithRankings.length} Pokemon`);
  console.log(`✓ Created ${Object.keys(familyNames).length} name mappings`);
  console.log(`✓ Created ${Object.keys(rankings).length} family displays`);

  // Write processed data to dist directory
  await mkdir(distDir, { recursive: true });
  const outputData = { familyNames, rankings };
  const outputPath = join(distDir, "pokemon-data.json");
  await writeFile(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
  console.log(`✓ Wrote processed data to ${outputPath}`);

  return { familyNames, rankings };
}

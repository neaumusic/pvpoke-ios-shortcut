import { prepareData } from "./prepare-data.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

/**
 * Simple command-line demo for testing the lookup logic
 */
async function demo() {
  console.log("Loading Pokemon data...\n");
  const { familyNames, rankings } = await prepareData();

  console.log(`\nLoaded ${Object.keys(familyNames).length} Pokemon names`);
  console.log(`Loaded ${Object.keys(rankings).length} families\n`);

  // Test function that mimics the shortcut logic
  function lookupPokemon(searchName: string): string {
    const searchUpper = searchName.toUpperCase().trim();

    // Look up family ID from name map
    const familyId = familyNames[searchUpper];

    if (!familyId) {
      return `Pokemon "${searchName}" not found.`;
    }

    // Get the formatted family data
    const familyDisplay = rankings[familyId];

    if (!familyDisplay) {
      return `Family data not found for "${searchName}".`;
    }

    return familyDisplay;
  }

  // Run some example lookups
  const examples = ["pikachu", "charmander", "medicham", "azumarill"];

  for (const name of examples) {
    console.log("=".repeat(60));
    console.log(lookupPokemon(name));
    console.log();
  }

  // If command line argument provided, look that up
  if (process.argv[2]) {
    console.log("=".repeat(60));
    console.log(lookupPokemon(process.argv[2]));
    console.log();
  }
}

demo().catch(console.error);

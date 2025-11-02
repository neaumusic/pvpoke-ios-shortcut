import { writeFile, mkdir, copyFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import { prepareData } from "./prepare-data.js";

import { buildShortcut, variable } from "@joshfarrant/shortcuts-js";
import actions from "@joshfarrant/shortcuts-js/actions";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

async function buildPvPokeShortcut() {
  console.log("Building PvPoke Rankings iOS Shortcut...\n");
  console.log("Preparing data...");

  const { familyNames, rankings } = await prepareData();

  console.log(`\nData prepared successfully!`);
  console.log(`  Name map size: ${(JSON.stringify(familyNames).length / 1024).toFixed(1)} KB`); // prettier-ignore
  console.log(`  Family data size: ${(JSON.stringify(rankings).length / 1024).toFixed(1)} KB`); // prettier-ignore
  console.log("\nBuilding shortcut actions...");

  const shortcutActions = [
    actions.dictionary({
      value: { FamilyNames: familyNames, Rankings: rankings },
    }),
    actions.comment({
      text: "Set variable FamilyNames to (Clear Variable) - Dictionary - 'FamilyNames'",
    }),
    actions.setVariable({
      variable: variable("FamilyNames"),
    }),
    actions.comment({
      text: "Set variable Rankings to (Clear Variable) - Dictionary - 'Rankings'",
    }),
    actions.setVariable({
      variable: variable("Rankings"),
    }),
    actions.repeat({
      count: 1337,
      actions: [
        actions.comment({ text: "Allow Multiple Lines - False" }),
        actions.ask({
          question: "Pokemon name:",
          inputType: "Text",
          defaultAnswer: "",
        }),
        actions.comment({ text: "Change Ask for Input to UPPERCASE" }),
        actions.changeCase({
          text: actions.getVariable({ variable: variable("PokemonName") }),
          type: "UPPERCASE",
        }),
        actions.comment({ text: "Get Value for Updated Text in FamilyNames" }),
        actions.getDictionaryValue({
          key: actions.getVariable({ variable: variable("PokemonNameUppercase") }),
          dictionary: actions.getVariable({ variable: variable("FamilyNames") }),
        }),
        actions.comment({ text: "If Dictionary Value has any value" }),
        actions.conditional({
          ifTrue: [
            actions.comment({ text: "Get Value for Dictionary Value in Rankings" }),
            actions.getDictionaryValue({
              key: actions.getVariable({ variable: variable("FamilyName") }),
              dictionary: actions.getVariable({ variable: variable("Rankings") }),
            }),
            actions.comment({ text: "Show Dictionary Value" }),
            actions.showResult({
              text: actions.getVariable({ variable: variable("Rankings") }),
            }),
          ],
        }),
      ],
    }),
  ];

  console.log("Building shortcut file...");
  const shortcut = buildShortcut(shortcutActions);

  // Ensure build and dist directories exist
  const buildDir = join(rootDir, "build");
  const distDir = join(rootDir, "dist");
  await mkdir(buildDir, { recursive: true });
  await mkdir(distDir, { recursive: true });

  // Write unsigned shortcut to build
  const unsignedPath = join(buildDir, "PvPokeRankings.unsigned.shortcut");
  await writeFile(unsignedPath, shortcut);

  console.log("✓ Unsigned shortcut created");
  console.log(`  Location: ${unsignedPath}`);
  console.log(`  Size: ${(shortcut.length / 1024 / 1024).toFixed(2)} MB`);

  // Copy as plist for debugging
  const plistPath = join(buildDir, "PvPokeRankings.plist");
  await copyFile(unsignedPath, plistPath);

  // Convert to XML format for easier viewing in text editors
  try {
    await execAsync(`plutil -convert xml1 -o "${join(buildDir, "PvPokeRankings.xml.plist")}" "${plistPath}"`);

    // Also convert to JSON format with pretty printing
    const jsonPath = join(buildDir, "PvPokeRankings.json");
    await execAsync(`plutil -convert json -o "${jsonPath}" "${plistPath}"`);

    // Make the JSON pretty-printed for better readability
    try {
      const jsonContent = await import("fs").then((fs) => fs.promises.readFile(jsonPath, "utf8"));
      const prettyJson = JSON.stringify(JSON.parse(jsonContent), null, 2);
      await writeFile(jsonPath, prettyJson);
    } catch (jsonError) {
      console.log("⚠ Could not format JSON for better readability");
    }

    console.log("✓ Debug files created");
    console.log(`  Binary plist: ${plistPath}`);
    console.log(`  XML plist: ${join(buildDir, "PvPokeRankings.xml.plist")}`);
    console.log(`  JSON: ${jsonPath}`);
  } catch (error) {
    console.log("⚠ Could not convert plist to other formats");
    console.log(`  Binary plist available at: ${plistPath}`);
  }

  // Try to sign the shortcut and put signed version in dist
  const signedPath = join(distDir, "PvPokeRankings.shortcut");
  console.log("\nSigning shortcut...");

  try {
    await execAsync(`shortcuts sign --mode anyone --input "${unsignedPath}" --output "${signedPath}"`);
    console.log("✓ Shortcut signed successfully!");
    console.log(`  Location: ${signedPath}`);
  } catch (error) {
    console.log("⚠ Could not sign shortcut (macOS shortcuts CLI not available)");
    console.log("  Copying unsigned version to dist instead");
    await copyFile(unsignedPath, signedPath);
  }

  console.log("\n✓ Shortcuts created:");
  console.log(`  Unsigned: ${unsignedPath}`);
  console.log(`  For iOS: ${signedPath}`);
  console.log("\nTo install:");
  console.log("1. AirDrop the .shortcut file to your iOS/Mac device");
  console.log("2. Tap/open the file and choose 'Add Shortcut'");
  console.log("3. Clear and re-map the variables (access dictionary values)");
  console.log("4. Run the shortcut");
}

buildPvPokeShortcut().catch(console.error);

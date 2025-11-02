#!/usr/bin/env node

import { mkdir, writeFile, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const PVPOKE_REPO = "https://raw.githubusercontent.com/pvpoke/pvpoke/master";

const FILES_TO_SYNC = [
  { url: "src/data/gamemaster/pokemon.json", dest: "pokemon.json" },
  { url: "src/data/rankings/all/overall/rankings-500.json", dest: "rankings-500.json" },
  { url: "src/data/rankings/all/overall/rankings-1500.json", dest: "rankings-1500.json" },
  { url: "src/data/rankings/all/overall/rankings-2500.json", dest: "rankings-2500.json" },
  { url: "src/data/rankings/all/overall/rankings-10000.json", dest: "rankings-10000.json" },
];

async function ensureDir(filePath) {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url, destinationPath) {
  console.log(`Downloading: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    await ensureDir(destinationPath);
    await writeFile(destinationPath, content, "utf-8");

    console.log(`✓ Saved to: ${destinationPath}`);
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error.message);
    throw error;
  }
}

async function syncData() {
  console.log("Checking for existing data files...\n");

  const dataDir = join(rootDir, "build", "data");

  try {
    let downloadedCount = 0;
    let skippedCount = 0;

    for (const file of FILES_TO_SYNC) {
      const url = `${PVPOKE_REPO}/${file.url}`;
      const destinationPath = join(dataDir, file.dest);

      if (await fileExists(destinationPath)) {
        console.log(`✓ Already exists: ${file.dest}`);
        skippedCount++;
      } else {
        await downloadFile(url, destinationPath);
        downloadedCount++;
      }
    }

    console.log(`\n✓ Data sync completed! (${downloadedCount} downloaded, ${skippedCount} skipped)`);
    if (downloadedCount > 0) {
      console.log("\nData files available:");
      console.log("- build/data/pokemon.json");
      console.log("- build/data/rankings-500.json (Little League)");
      console.log("- build/data/rankings-1500.json (Great League)");
      console.log("- build/data/rankings-2500.json (Ultra League)");
      console.log("- build/data/rankings-10000.json (Master League)");
    }
  } catch (error) {
    console.error("\n✗ Data sync failed:", error.message);
    process.exit(1);
  }
}

syncData();

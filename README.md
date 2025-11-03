# PvPoke iOS Shortcut

An iOS/Mac Shortcut that looks up Pokemon PvP rankings across all leagues using data from [pvpoke.com](https://pvpoke.com/).

## Features

- 🔄 Syncs data from the official [pvpoke repository](https://github.com/pvpoke/pvpoke)
- 🔍 Search Pokemon by name (supports partial matches)
- 👨‍👩‍👧‍👦 Shows rankings for entire evolution families
- 📴 Works completely offline (data embedded in shortcut)
- 🎮 All competitive leagues:
  - 🔵 Little League (500 CP)
  - 🟢 Great League (1500 CP)
  - 🟣 Ultra League (2500 CP)
  - 🔴 Master League (unlimited CP)

## Quick Start

Download the signed shortcut file from Releases, and just open/install it. May not be the latest pvpoke data.

## Dev Install (Latest PvPoke Data)

```bash
# Install dependencies
npm install

# Download latest Pokemon data if none exists, build shortcut, sign and install
npm run build
```

This creates `dist/PvPokeRankings.shortcut` which you can AirDrop to your iOS/Mac device (or just install over iCloud).

You will need to finish connecting variables within the Shortcut. To do this, click the '...' and simply follow the commented instructions as you scroll down. I highly recommend doing this on your iOS device because the macOS editor is janky.

## Data Attribution

All Pokemon data is sourced from the [pvpoke/pvpoke](https://github.com/pvpoke/pvpoke) repository.

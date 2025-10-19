# Outlaw Robbery Creator

Outlaw Robbery Creator is a FiveM resource that lets staff members build, edit and preview robbery interaction spots directly in-game. It includes a NUI editor, persistence layer (KVP or JSON) and optional ox_target visualization so administrators can iterate quickly on robbery content without touching the database.

## Features

- 🔧 **In-game robbery editor** – Open the creator UI with a command or keybind to create, update or delete robbery spots.
- 💾 **Flexible persistence** – Store spots in resource KVP (default) or a JSON file inside the resource folder.
- 👮 **Robbery validation** – Built-in checks for cooldowns, minimum police online, lockpick requirements, job restrictions and more.
- 🎯 **ox_target integration** – Optionally draws interactable spheres for each configured spot with configurable labels, icons and radii.
- 🧰 **ESX bridge** – Rewards can be paid to standard or black money accounts, optional lockpick removal, and police job detection.
- 🖥️ **Lightweight UI** – Responsive NUI (HTML/CSS/JS) built with vanilla JavaScript.

## Requirements

| Component | Purpose |
|-----------|---------|
| [ox_lib](https://overextended.dev/ox_lib) | Notifications, callbacks, progress UI and skill checks. |
| [ox_target](https://overextended.dev/ox_target) *(optional)* | Visual target spheres for robbery spots. Disable via config if you do not use it. |
| ESX / es_extended *(optional)* | Required for payout, job checks and item removal features. Resource gracefully degrades if ESX is unavailable. |

The resource targets the **cerulean** FXServer build and GTA V (`game 'gta5'`).

## Installation

1. Download or clone this repository into your server resources folder.
2. Rename the folder to `outlaw_robbery_creator` if needed.
3. Ensure `ox_lib` is started before this resource. If you use `ox_target`, start it as well.
4. Add `start outlaw_robbery_creator` to your server configuration.
5. Grant permissions to trusted staff accounts:
   ```ini
   add_ace group.admin outlaw.robbery allow
   ```
6. (Optional) If you prefer JSON storage, create an empty file at `resources/[...]/outlaw_robbery_creator/data/robbery_spots.json` or let the script auto-generate it on first run.

## Configuration

All configuration lives in [`config.lua`](config.lua):

- `Config.CreatorAce` – ACE permission required to open the creator UI and run server callbacks.
- `Config.Storage` – Choose between `'kvp'` (resource key-value pairs) and `'json'` (file saved in the resource).
- `Config.JsonPath` / `Config.KvpKey` – Filenames or keys for the selected storage backend.
- `Config.UseOxTarget` – Toggle creation of ox_target spheres when the resource starts.
- `Config.Target` – Customize default target radius, interaction distance, icon, label and optional debug mode.
- `Config.Defaults` – Initial values applied when creating a new robbery spot from the UI.
- `Config.Types` – List of robbery type identifiers and display labels shown in the UI.
- `Config.Robbery` – Gameplay tuning: lockpick requirements, reward accounts, duration, police jobs, cooldown enforcement, etc.

Restart the resource after editing the configuration file.

## Usage

### Commands & Keybinds

- `/robmenu` – Opens the creator interface (requires `Config.CreatorAce`).
- Default keybind: **F7** (`RegisterKeyMapping`) which players can change in FiveM keybind settings.

### Creating or Editing Spots

1. Open the UI using the command or keybind.
2. Use **Use Player Coords** to capture your current position and heading.
3. Fill in metadata (label, type, radius, rewards, cooldown, min police).
4. Click **Save** to create a new spot or update the selected one.
5. Select an existing entry from the list to edit or delete it.

### Robbery Flow (players)

1. Walk into the ox_target sphere and interact (`E` by default).
2. The server validates permissions, police count, cooldowns and lockpick requirements.
3. Optionally complete the ox_lib skill check and progress circle.
4. On success the server rewards the player and applies cooldowns.

## Data & Persistence

- Spots are cached in memory on the server and persisted after every create/update/delete.
- JSON mode saves to `data/robbery_spots.json` inside the resource. Ensure the path is writable.
- KVP mode stores data via `SetResourceKvp`, scoped per resource.
- Spot coordinates are rounded to 3 decimals and duplicate positions are merged automatically to avoid duplicate entries.

## Events & Callbacks

| Name | Type | Description |
|------|------|-------------|
| `lib.callback.register('orc:list')` | Server | Returns current list, type metadata and default values for the UI. |
| `lib.callback.register('orc:rob:begin')` | Server | Validates a robbery request (permissions, cooldowns, police count, inventory). |
| `TriggerServerEvent('orc:rob:finish', id)` | Client | Notifies the server that the client completed the robbery minigame. |
| `TriggerServerEvent('orc:create' / 'orc:update' / 'orc:delete')` | Client | CRUD operations from the UI.
| `RegisterNetEvent('orc:echo')` | Client | Receives status messages, newly created spots or removals from the server. |

## UI Development

The NUI lives under [`html/`](html/):

- [`index.html`](html/index.html) – Main markup for the creator.
- [`style.css`](html/style.css) – Styling (vanilla CSS, responsive layout).
- [`app.js`](html/app.js) – Logic for the UI, NUI events and fetch calls.

To iterate on styles locally you can open `index.html` in a browser. FiveM will load the files through the resource manifest during runtime.

## Troubleshooting

- **UI does not open** – Verify the invoking player has the ACE permission defined in `Config.CreatorAce` and that `ox_lib` is started. Check server console for permission errors printed by the resource.
- **No target spheres** – Ensure `Config.UseOxTarget = true` *and* `ox_target` is running. The script automatically disables target creation if the export is missing.
- **ESX functions missing** – The resource detects ESX at runtime. If you use another framework you may need to adapt the payout logic in [`server/main.lua`](server/main.lua).

## Credits & License

Created by **Outlaw Scripts**. Distributed under the terms of the [MIT License](LICENSE).

Contributions and suggestions are welcome!

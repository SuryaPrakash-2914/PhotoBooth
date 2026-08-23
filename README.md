# NANAGRAPHY Photo Booth

Offline-first Windows Photo Booth Desktop Application built with Electron + React + TypeScript + Vite + Tailwind CSS + Zustand.

## Current Status: Phase 1 (UI + Navigation + Mocks)

Complete customer flow with mock camera, payment and printer:

```
HOME → PHOTO TYPE → CAMERA → EDIT → PREVIEW → PAYMENT → PRINTING → COMPLETE → HOME
```

## Tech Stack

- **Electron** – desktop shell & kiosk mode
- **React 18 + TypeScript** – UI
- **Vite** – build tooling
- **Tailwind CSS** – styling
- **Zustand** – session state
- **React Router** – screen navigation

## Project Structure

```
photo-booth/
├── electron/          # Main process, IPC, services
│   ├── main.ts
│   ├── preload.ts
│   ├── camera/
│   ├── printer/
│   ├── payment/
│   ├── storage/
│   └── ...
├── src/
│   ├── pages/         # All customer screens
│   ├── store/         # Zustand session store
│   ├── types/
│   └── ...
├── config/            # Local JSON configuration
│   ├── photo-types.json
│   ├── settings.json
│   └── pricing.json
└── assets/
```

## Getting Started

```bash
# Install dependencies
npm install

# Run in development (Vite + Electron)
npm run electron:dev

# Or just the React UI in browser
npm run dev
```

## Development Phases

| Phase | Focus |
|-------|--------|
| **1** | Full UI flow + mocks (current) |
| **2** | Local configuration loading |
| **3** | Real DSLR camera integration |
| **4** | Image processing (Sharp/Canvas) + layout engine |
| **5** | Payment provider integration |
| **6** | Real printer integration |
| **7** | Windows packaging, kiosk hardening, logging |

## Configuration

All configurable data lives in `/config`:

- `photo-types.json` – available products & layouts
- `settings.json` – app behaviour, theme, timeouts
- `pricing.json` – currency & tax settings

Future Admin app will write to these same files.

## Architecture

```
React UI  →  Preload (contextBridge)  →  Electron IPC  →  Local Services
                                                              ├── Camera
                                                              ├── Image
                                                              ├── Printer
                                                              ├── Payment
                                                              ├── Storage
                                                              └── Config
```

- `contextIsolation: true`
- `nodeIntegration: false`
- No cloud dependency for core flow

## Session

Sessions exist only in memory + local temporary folders under the OS application data directory:

```
sessions/session_YYYYMMDD_XXX/
├── original/
├── edited/
└── final/
```

## License

UNLICENSED – Proprietary
```

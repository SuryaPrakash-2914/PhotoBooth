# NANAGRAPHY Photo Booth

Offline-first Windows Photo Booth Desktop Application built with Next.js, Electron, React, TypeScript, Tailwind CSS, and Zustand.

## Current Status: Phase 1 (UI + Navigation + Mocks)

Complete customer flow with mock camera, payment and printer:

```
HOME → PHOTO TYPE → CAMERA → EDIT → PREVIEW → PAYMENT → PRINTING → COMPLETE → HOME
```

## Tech Stack

- **Electron** – desktop shell & kiosk mode
- **Next.js App Router** – renderer and client-side screen navigation
- **React 18 + TypeScript** – kiosk UI
- **Tailwind CSS** – styling
- **Zustand** – session state

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
│   ├── app/           # Next.js App Router routes and root layout
│   ├── screens/       # Customer and admin screen components
│   ├── store/         # Zustand session store
│   ├── types/
│   └── ...
├── config/            # Local JSON configuration
│   ├── photo-types.json
│   ├── settings.json
│   └── pricing.json
└── public/            # Static renderer assets
```

## Getting Started

```bash
# Install dependencies
npm install

# Run the renderer in a browser at http://localhost:5173/
yarn dev

# Run the Electron desktop app with the Next.js dev server
yarn electron:dev

# Typecheck and build the Windows installer
yarn typecheck
yarn build
```

The packaged Electron app starts the production Next.js server on a private localhost port. Installer output is written to `release/`.

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

The Admin screen can update these files through Electron IPC.

## Architecture

```
Next.js client UI  →  Preload (contextBridge)  →  Electron IPC  →  Local Services
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

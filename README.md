# Knowledge Point

An AI agent desktop application for analyzing files with zero data retention.

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

## Development

To run the development environment:

```bash
npm run dev
```

This will:
1. Start the Vite dev server (runs on http://localhost:5173)
2. Launch the Electron app

The Electron window will open automatically. You'll see:
- Left sidebar with file browser
- Right side with chat interface
- DevTools console open (useful for debugging)

### What's Happening in Dev Mode

- **Vite Server**: Handles hot module reloading for the Svelte UI
- **Electron Main**: Watches and rebuilds when you change `src/main/` files
- **Auto-reload**: Changes to renderer code reflect immediately in the app

## Project Structure

```
src/
├── main/           # Electron main process (backend)
│   ├── index.ts    # App entry point
│   ├── preload.ts  # IPC bridge
│   └── utils.ts    # Utilities
└── renderer/       # Svelte UI (frontend)
    ├── main.ts     # UI entry point
    ├── app.svelte  # Root component
    ├── components/ # UI components
    └── lib/        # Utilities
```

## Next Steps

1. Implement file browser with `dialog.showOpenDialog()`
2. Add file tree rendering with recursive directory traversal
3. Connect to OpenRouter API
4. Implement conversation persistence
5. Build production bundle

## Building for Production

```bash
npm run build
```

This creates a distributable app in the `out/` directory.

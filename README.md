# Roblox Login Mock

This project serves a local Roblox-style login mock page with a small Node.js HTTP server.

## Prerequisites

- Node.js 18 or newer
- npm, which is included with Node.js
- Windows PowerShell, Command Prompt, or Git Bash
- Write access to this folder, because the server reads and updates `users.json`

No third-party packages are required.

## Start the server

1. Open a terminal in this folder.
2. Run `npm start`.
3. Open `http://localhost:3000` in your browser.

The server listens on port 3000 by default. To use a different port, set `PORT` before starting the server.

## Notes

- The server serves `login.html` and the local assets in this folder.
- `users.json` is initialized automatically if it is missing or empty.
- Stop the server with Ctrl+C.

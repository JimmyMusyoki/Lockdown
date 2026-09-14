# Lockdown Blocker

A Cold Turkey–style website & app blocker for Windows, built with Electron.

## Features
- **Website blocking** — edits the Windows hosts file to redirect blocked domains to `127.0.0.1`
- **App blocking** — polls running processes every 3s and force-kills anything on the blocked list
- **Lock timer** — once started, blocking stays active until the timer expires while the block list remains editable
- **Watchdog** — re-applies the hosts block every 5s, so manually editing the hosts file back doesn't work while a lock is active
- **Tray persistence** — closing the window while locked hides it instead of quitting, so the block can't be dodged by closing the app
- **LAN controller** — the same app can run as a password-protected agent on every desktop, while one desktop sends website, app, and lock commands to the others

## Requirements
- Node.js 18+
- Windows (this build targets Windows specifically — hosts path and `taskkill` are Windows-specific)
- **Must run as Administrator** — editing the hosts file and killing arbitrary processes both require elevated permissions. This is already configured in `package.json` (`requestedExecutionLevel: requireAdministrator`) for the packaged build.

## Setup
```bash
npm install
```

## Run in development
Right-click your terminal / IDE and "Run as Administrator", then:
```bash
npm start
```

### Network control

Install and run the app on each desktop on the same LAN. Each installation exposes a protected agent on port `47821` by default. From the controller panel, enter the target computer's local IP address and port, then authenticate with the shared agent password. Commands use a challenge-response exchange; the password itself and its stored hash are never sent in an API response.

Windows Firewall may ask permission for the app's private-network access. Network control is intended for a trusted LAN; it does not provide internet-facing security or router-wide DNS blocking.

## Build a Windows installer
```bash
npm run dist
```
This uses `electron-builder` to produce an NSIS installer in `dist/`. The installer will prompt for admin rights on launch, matching Cold Turkey's behavior.

## Project structure
```
main.js              Electron main process — wires everything together, IPC handlers
preload.js            Safe bridge exposing window.api to the renderer
src/store.js           JSON-based local storage (block lists, schedules, lock state)
src/hostsBlocker.js     Hosts file read/write + DNS flush
src/appBlocker.js       Process polling + taskkill
src/lockManager.js      Lock timer logic (start, check, hash password)
renderer/               UI (HTML/CSS/JS) — block list editor + lock controls
```

## Known limitations / next steps to harden it further
- **Bypass via Task Manager**: a determined user with admin rights can still kill the app itself via Task Manager. Cold Turkey solves this with a separate always-on Windows service that's harder to kill than the GUI app — consider splitting the watchdog into a `node-windows` service.
- **Safe mode bypass**: booting into Windows Safe Mode skips most startup services, including this one. Cold Turkey has the same limitation on free tiers.
- **Hosts file conflicts**: if another tool also manages the hosts file, the marker-based strip/reapply logic could conflict — test with your specific setup.
- **Scheduling**: `schedules` is defined in the data store but not yet wired to auto-start/stop blocks — add `node-schedule` cron jobs in `main.js` reading `data.schedules`.
- **Password on unlock**: currently the password is stored but not yet enforced anywhere (there's no "unlock early with password" flow) — intentional, since Cold Turkey's own point is that locks can't be broken early. Add it only if you want an escape hatch.

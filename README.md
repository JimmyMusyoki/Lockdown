# Lockdown Blocker

A Cold Turkey–style website & app blocker for Windows, built with Electron.

## Features
- **Website blocking** — edits the Windows hosts file to redirect blocked domains to `127.0.0.1`
- **App blocking** — polls running processes every 3s and force-kills anything on the blocked list
- **Lock timer** — once started, blocking stays active until the timer expires while the block list remains editable
- **Watchdog** — re-applies the hosts block every 5s, so manually editing the hosts file back doesn't work while a lock is active
- **Tray persistence** — closing the window while locked hides it instead of quitting, so the block can't be dodged by closing the app
- **LAN controller** — the same app can run as a password-protected agent on every desktop, while one desktop sends website, app, and lock commands to the others
- **Background agent** — installed builds start with Windows, stay in the system tray, and open the private-network firewall rule for the LAN agent

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

Install and run the app on each desktop on the same LAN. Each installation exposes an HTTPS agent on port `47821` by default. All installations use the shared agent password configured for the app. Enter it in the Network controller panel to start a two-minute command session; after that, the app prompts again. Commands use a single-use challenge, timestamp, request ID, and signed command envelope. The password itself is never sent over the network. The controller pins each agent's first observed certificate for the current session and rejects certificate changes.

The installed build starts with Windows and runs in the background from the system tray. It requests administrator rights so it can edit the hosts file, control processes, and create a private-network Windows Firewall rule for port `47821`. Use the tray menu's **Quit Lockdown** command to stop it completely.

## Build a Windows installer
```bash
npm run dist
```
This uses `electron-builder` to produce an NSIS installer in `dist/`. The installer will prompt for admin rights on launch, matching Cold Turkey's behavior.

## Production Updates

Lockdown Blocker uses `electron-updater` with GitHub Releases for production updates. The configured release repository is `JimmyMusyoki/Lockdown`. Clients must install a packaged build; development runs never contact the update service.

### Release a new version

1. Make and test your code changes.
2. Change the `version` field in `package.json` using semantic versioning (`MAJOR.MINOR.PATCH`). For example:

	```bash
	npm version 1.1.0 --no-git-tag-version
	```

	This updates both `package.json` and `package-lock.json`. Use `1.0.1` for a patch, `1.1.0` for a backwards-compatible feature, and `2.0.0` for a breaking release.
3. Build the Windows installer:

	```bash
	npm run build
	```

4. Publish the installer and updater metadata to the GitHub repository's Releases page. With a GitHub token that can create releases, set `GH_TOKEN` and run:

	```powershell
	$env:GH_TOKEN = "your-github-token"
	npm run publish
	```

	The publish configuration is already in `package.json` and targets the `JimmyMusyoki/Lockdown` repository. Alternatively, create a GitHub Release manually and upload every update asset from `dist/`, including the `.exe`, `latest.yml`, and `.blockmap` files. Do not omit `latest.yml`.

### How clients update

Packaged clients check GitHub Releases at startup and every six hours. Automatic updates are enabled by default: when a newer release is found, the verified update downloads and installs silently, then the application restarts. The Overview update panel shows the version and progress. No arbitrary URL or local path is executed.

Automatic update checks can be turned off in the Overview update panel, although that means the client will not automatically receive releases until checks are enabled again. A manual **Check for updates** remains available. The current version, last check time, status, download progress, and installation action are shown there.

### Safe testing and failures

Use a new higher version for testing, publish it as a test GitHub Release, and install the previous packaged version on a separate test machine. Never test updates by replacing files inside an installed application. If the check, download, signature, or installation fails, the existing installation stays in place and the update panel reports the error; retry after correcting the release assets or network access.

For production security, publish signed Windows installers by supplying your code-signing certificate through `electron-builder`'s supported environment variables. Because Lockdown Blocker requests administrator rights to edit the hosts file and control processes, Windows policy or UAC can still require an authorized administrator context; software cannot safely bypass that security boundary. Do not disable Windows security features or point the updater at an untrusted server.

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

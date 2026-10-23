# To-do list app

A small, dependency-free MVP built with HTML, CSS, and JavaScript modules. Add tasks, edit titles inline (Save / Cancel, or Escape to cancel), mark tasks complete or active, and delete tasks. A remaining-task counter and empty state keep the list clear.

## Local setup and run

Requirements: Python 3 for the local web server; Node.js 22+ to run tests. No dependency installation or build step is needed.

```sh
git clone https://github.com/mattrach603/to-do-list-app.git
cd to-do-list-app
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. Stop the server with Ctrl+C. Serve over HTTP rather than opening index.html directly, so browser modules work. After cloning, check out the MVP branch if it has not yet been merged.

```sh
npm test
```

## Files and model

- `index.html`: accessible page structure and add form.
- `styles.css`: responsive layout, completion styling, and keyboard focus indicators.
- `src/tasks.js`: immutable task operations, validation, and storage helpers.
- `src/app.js`: DOM rendering, inline editing, and persistence/error handling.
- `test/tasks.test.js`: task lifecycle, persistence, and invalid-data checks.
- `package.json`: test command; no third-party packages.

Each task is `{ id, title, completed, createdAt }`: a UUID, trimmed 1–200 character title, boolean completion status, and ISO creation timestamp. Titles render as text, never HTML.

Tasks persist under `todo.tasks.v1` in localStorage for the current browser and origin. Keep the same hostname and port to see the same list. There is no account, server database, or cross-device sync. Clearing site data deletes tasks; deleting a task is immediate. Storage writes must succeed before a change appears. Invalid or unavailable storage shows an error and disables changes to protect existing data; inspect/export existing storage before clearing the key to recover.

## Manual smoke check

1. Add two tasks; verify blank titles are rejected.
2. Edit one, save, then edit again and cancel with Escape.
3. Complete and reopen a task; verify the counter updates.
4. Reload and verify titles and completion state persist.
5. Delete both tasks and verify the empty state returns.
6. Use Tab, Enter, and Space to operate the controls; check a narrow viewport.

# Knowledge Base

A single-user, Confluence-style documentation and knowledge management application. Designed for fast, distraction-free writing with strong information architecture and local-first data ownership.

## Running the Application

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose

### Start

```bash
docker compose up -d
```

Open **http://localhost:3033** in your browser.

### Stop

```bash
docker compose down
```

To reset all data:

```bash
docker compose down -v
```

### Run Tests

**Backend unit tests** (Jest + Supertest):

```bash
cd backend && npm install && npm test
```

**Frontend unit tests** (Vitest + Testing Library):

```bash
cd frontend && npm install && npx vitest run
```

**End-to-end tests** (Playwright, requires the app to be running on port 3033):

```bash
cd e2e && npm install && npx playwright install chromium && npx playwright test
```

---

## Features

- **Rich text editing** — Full WYSIWYG editor powered by TipTap (ProseMirror) with a formatting toolbar: bold, italic, underline, strikethrough, highlight, three heading levels, bullet lists, ordered lists, task/checkbox lists, blockquotes, code blocks with syntax highlighting, horizontal rules, links, images, and tables.
- **Hierarchical page tree** — Pages can be nested under other pages to form an arbitrarily deep tree, mirroring Confluence's space/page hierarchy. The sidebar renders this tree with expand/collapse toggles.
- **Command palette** — Press `Cmd+K` (or `Ctrl+K`) to open a floating search/command palette for instant page navigation and page creation.
- **Sidebar filter** — Real-time text filter in the sidebar narrows the page tree to matching titles, preserving ancestor nodes so the tree structure remains visible.
- **Auto-save** — Every edit is debounced (800 ms) and saved automatically. A status indicator shows `Unsaved changes`, `Saving...`, `Saved`, or `Save failed`.
- **Version history** — Each save that changes a page's title or content snapshots the previous state into a versions table. A version history panel lets you browse and restore any prior version.
- **Breadcrumb navigation** — When viewing a nested page, a breadcrumb trail shows the full ancestor path with clickable links.
- **Full-text search** — The search API performs `LIKE` matching against both page titles and body content, returning snippets.
- **Page reordering** — A dedicated reorder endpoint accepts batch position/parent updates inside a SQLite transaction.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Docker Container                  │
│                                                     │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │  Static      │    │  Express.js API Server   │   │
│  │  Frontend    │◄──►│                          │   │
│  │  (React SPA) │    │  /api/pages   CRUD       │   │
│  │              │    │  /api/pages/search        │   │
│  │  served by   │    │  /api/pages/:id/versions  │   │
│  │  Express     │    │  /api/health              │   │
│  └─────────────┘    └────────────┬─────────────┘   │
│                                  │                   │
│                         ┌────────▼────────┐         │
│                         │  SQLite (WAL)   │         │
│                         │  /app/data/     │         │
│                         │  wiki.db        │         │
│                         └─────────────────┘         │
│                           ▲                          │
│                           │ Docker Volume            │
└───────────────────────────┼─────────────────────────┘
                            │
                      wiki-data volume
```

The system follows a classic **three-tier architecture** collapsed into a single container:

1. **Presentation tier** — A React single-page application built by Vite, served as static files by Express.
2. **Application tier** — An Express.js REST API handling CRUD operations, search, versioning, and reordering.
3. **Data tier** — A SQLite database using WAL (Write-Ahead Logging) mode for concurrent read performance, persisted to a Docker volume.

A single Express process serves both the API (`/api/*`) and the compiled frontend (all other routes fall through to `index.html` for SPA client-side routing).

---

## Technical Design

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 20 (Alpine) | Lightweight, LTS runtime |
| Framework | Express 4 | Minimal HTTP framework |
| Database | better-sqlite3 | Synchronous, zero-dependency SQLite bindings |
| IDs | uuid v4 | Collision-resistant primary keys |

**Database schema** — Two tables:

- `pages` — Stores `id`, `title`, `content` (HTML), `parent_id` (self-referential FK for tree structure), `position` (integer for ordering), `icon`, and timestamps.
- `page_versions` — Append-only history table storing prior `title` and `content` snapshots with a cascading FK to `pages`.

Three indexes accelerate common queries: parent lookups, update-time ordering, and version lookups by page.

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 | Component-based UI |
| Build tool | Vite 6 | Fast HMR and optimized production builds |
| Editor | TipTap 2 (ProseMirror) | Extensible rich-text editing |
| Syntax highlighting | lowlight (highlight.js) | Code block language detection |

The frontend is 7 components plus an API client module:

| File | Lines | Responsibility |
|------|-------|---------------|
| `App.jsx` | 144 | Root state management, page CRUD orchestration, keyboard shortcuts |
| `Sidebar.jsx` | 170 | Page tree rendering, expand/collapse, inline filter, recursive `TreeNode` |
| `Toolbar.jsx` | 166 | Declarative toolbar definition, active-state highlighting |
| `EditorView.jsx` | 138 | TipTap editor lifecycle, debounced auto-save, title editing |
| `CommandPalette.jsx` | 96 | Overlay search dialog, keyboard navigation, action dispatch |
| `VersionHistory.jsx` | 53 | Slide-out panel listing and restoring prior versions |
| `Breadcrumbs.jsx` | 35 | Ancestor chain computation and clickable navigation |
| `api.js` | 25 | Thin fetch wrapper around all REST endpoints |

### Infrastructure

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: Stage 1 compiles the React app, Stage 2 installs native backend dependencies and assembles the final image |
| `docker-compose.yml` | Single-service definition exposing port 3033 with a named volume for SQLite persistence |
| `.dockerignore` | Excludes `node_modules`, `data`, and test artifacts from the build context |

---

## Design Patterns and Architectural Choices

### Singleton Database Connection (Lazy Initialization)

`db.js` uses module-scoped state with a `getDb()` accessor that lazily creates the SQLite connection and runs schema migrations on first access. This ensures a single connection per process, avoids initialization order issues, and enables the test suite to override `DB_PATH` to `:memory:` before the connection is opened.

### Client-Side Tree Construction

The API returns pages as a flat list. The `Sidebar` component builds the tree in-memory via a `buildTree()` function that creates a parent-child map in O(n) time. This keeps the API simple (a single `SELECT` with no recursive CTEs), avoids coupling the API to a particular tree-rendering strategy, and allows the frontend to freely filter and restructure the tree without additional network calls.

### Debounced Auto-Save

`EditorView` uses a `useRef`-based timeout to debounce saves at 800 ms. Each keystroke resets the timer. The save status indicator (`Unsaved changes` > `Saving...` > `Saved`) gives the user continuous feedback. This pattern avoids flooding the API with per-keystroke requests while ensuring no edits are lost.

### Automatic Version Snapshots (Copy-on-Write)

The `PUT /api/pages/:id` handler compares the incoming `title` and `content` against the existing row. If either has changed, it inserts the **previous** state into `page_versions` before applying the update. This is a copy-on-write pattern that builds version history as a side effect of normal saves, with zero user friction.

### Declarative Toolbar Definition

`Toolbar.jsx` defines formatting actions as a data array of objects (`{ icon, title, action, isActive, style }`), with string `'divider'` sentinels separating groups. The component maps over this array to render buttons. Adding a new formatting action requires only appending an object to the array — no JSX changes needed.

### Cancellable Async Effects

In `App.jsx`, the effect that fetches page content uses a `cancelled` flag in its cleanup function. If the user navigates away before the fetch completes, the stale response is silently discarded. This prevents a common React bug where an unmounted component attempts a state update.

### Key-Based Component Remounting

`EditorView` receives `key={activePageData.id}`, so React fully unmounts and remounts the editor when the user switches pages. This cleanly resets TipTap's internal state, the title input, and the save timer without manual imperative cleanup.

### SPA Fallback Routing

The Express server serves static files first, then falls back to `index.html` for any non-`/api` route. This enables client-side routing (if added later) without server-side route configuration, following the standard pattern for deploying SPAs behind an API server.

### Multi-Stage Docker Build

The Dockerfile separates concerns into two stages. Stage 1 is a throwaway Node environment that installs frontend dependencies and runs `vite build`. Stage 2 installs only production backend dependencies (including compiling `better-sqlite3` native bindings for Alpine Linux), copies the compiled frontend into the `public/` directory, and removes the C toolchain after compilation to minimize image size.

### Transactional Batch Reordering

The `POST /api/pages/reorder` endpoint wraps multiple position/parent updates in a `db.transaction()` call. If any update fails, the entire batch rolls back, preventing partial reorder states that would corrupt the tree structure.

---

## Codebase Metrics

| Category | Files | Lines of Code |
|----------|-------|---------------|
| Backend (server, DB, routes) | 3 | 257 |
| Frontend (components, styles, API client) | 11 | 1,384 |
| Configuration (Dockerfile, Compose, Vite, package.json) | 6 | 148 |
| Tests (unit + e2e) | 4 | 255 |
| Other (HTML entry, .dockerignore, test setup) | 5 | 30 |
| **Total** | **29** | **2,074** |

*Line counts exclude `node_modules`, `dist`, `data`, `package-lock.json`, and test result artifacts.*

---

## Test Suite

### Backend Unit Tests — 10 tests (Jest + Supertest)

Located in `backend/__tests__/pages.test.js`. These test the Express API in-process using an in-memory SQLite database (`DB_PATH=:memory:`), requiring no external services.

| Test | What it verifies |
|------|-----------------|
| `GET /api/health` | Health endpoint returns `{ status: "ok" }` |
| `GET /api/pages` (empty) | Returns empty array when no pages exist |
| `POST /api/pages` | Creates a page and returns it with generated `id` |
| `GET /api/pages/:id` | Retrieves a specific page by ID |
| `PUT /api/pages/:id` | Updates title and content |
| `GET /api/pages/:id/versions` | Returns version history after an update |
| `POST /api/pages` (child) | Creates a page with `parent_id` set |
| `GET /api/pages/search` | Finds pages matching a query string |
| `DELETE /api/pages/:id` | Deletes a page and returns success |
| `GET /api/pages/:id` (deleted) | Returns 404 for a deleted page |

### Frontend Unit Tests — 3 tests (Vitest + React Testing Library)

Located in `frontend/src/__tests__/App.test.jsx`. These render the `App` component with a fully mocked API layer and verify DOM structure.

| Test | What it verifies |
|------|-----------------|
| Renders the sidebar | The `[data-testid="sidebar"]` element is in the document |
| Shows empty state | The "Select a page or create a new one" message is visible |
| Renders new page button | The `[data-testid="new-page-btn"]` element is in the document |

### End-to-End Tests — 11 tests (Playwright)

Located in `e2e/tests/app.spec.js`. These run against the live Docker application at `http://localhost:3033` using a headless Chromium browser.

| Test | What it verifies |
|------|-----------------|
| Loads the app and shows sidebar | Sidebar and "Knowledge Base" heading are visible |
| Shows empty state initially | Empty state placeholder is displayed |
| Creates a new page | Clicking "+" renders the title input and toolbar |
| Edits page title | Filling the title input triggers auto-save (status shows "Saved") |
| Creates child page | Hovering a tree item and clicking the child button opens a new editor |
| Opens command palette | `Cmd+K` opens the palette overlay with a focused search input |
| Searches in command palette | Typing a query filters the palette results to matching pages |
| Sidebar filter works | Typing in the sidebar search narrows the tree to matching items |
| Deletes a page | Accepting the confirmation dialog removes the page from the tree |
| Editor toolbar has formatting buttons | The toolbar renders with clickable formatting buttons |
| Navigates between pages | Clicking a different page in the sidebar loads its title into the editor |

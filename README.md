# speckit-model-router

Pick which **AI model** runs each [spec-kit](https://github.com/github/spec-kit)
(SDD) step in [opencode](https://opencode.ai). Set it once, globally, **per
user** — it then applies to every project automatically, with the **native**
`/speckit.*` workflow, without touching your projects or your teammates' setup.

```
npx speckit-model-router
```

- Run the TUI, assign a model to each step (`/speckit.constitution`,
  `/speckit.specify`, `/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`,
  `/speckit.analyze`, `/speckit.checklist`, `/speckit.implement`), save, close.
- From then on, in any project (a fresh `specify init` or one that already has
  spec-kit), each `/speckit.*` command runs on **your** chosen model.
- Change models anytime: re-run the TUI — it takes effect on your next command,
  no opencode restart needed.

---

## Why it works where static config can't

Earlier "obvious" approaches fail:

| Approach | Why it fails |
| --- | --- |
| `model:` in the command's frontmatter (global) | A project's local `.opencode/commands/speckit.*.md` **shadows** the global one — your model is ignored. |
| `command.*.model` in `opencode.json` | opencode requires a `template` on every `command.*` entry; a model-only entry **invalidates the whole config**. |
| Commit `model:` into the project's command files | Gets committed → **affects the whole team**. |

The model of a command is decided at runtime by the caller, and opencode has no
hook to mutate it in place and no per-session model field. The only mechanism
that is **per-user, project-independent, and survives the native flow** is a
**global plugin** that intercepts the command and re-dispatches it on the right
model.

---

## How it works

Two pieces, shipped in one npm package:

```
┌─ CLI configurator (the bin) ─────────────┐     ┌─ opencode plugin ───────────────────────┐
│ npx speckit-model-router                 │     │ ~/.config/opencode/plugins/              │
│  • TUI: table + fuzzy model search       │     │   speckit-model-router.js                │
│  • writes the per-user model map         │     │  • hook: command.execute.before          │
│  • installs the plugin file (once)       │     │  • if command is /speckit.* and mapped:  │
└──────────────────────────────────────────┘     │      re-dispatch it on the chosen model  │
                  │                                │      via session.command({ model }),     │
                  ▼                                │      then suppress the original          │
   ~/.config/opencode/speckit-models.json ────────▶  (read fresh on every command)           │
   { "speckit.plan": "google/gemini-2.5-pro" }    └──────────────────────────────────────────┘
```

**Runtime sequence** (verified):
1. You run `/speckit.plan` in opencode (native, unchanged).
2. The plugin's `command.execute.before` fires with `command = "speckit.plan"`.
3. It reads `~/.config/opencode/speckit-models.json`; if `speckit.plan` has a
   model, it calls `client.session.command({ body: { command, arguments, model } })`
   to re-run the step on that model.
4. An in-memory guard lets the re-dispatched call pass through (no recursion).
5. The original is suppressed so the step runs **once**, on your model.

**Isolation is automatic**: nothing in the session or global config is mutated.
Your normal chat keeps its own model. The override is scoped strictly to the
spec-kit step. No "restore" logic is needed.

**Per-user, never shared**: the model map lives in your `~/.config/opencode/`
and is never written into any project, so it never affects teammates.

> **Note on suppression.** After re-dispatch the plugin throws to cancel the
> original (so the step makes exactly one model call). opencode may show a brief
> error notice for that cancellation; the command itself runs correctly on the
> chosen model. (The alternative — emptying the prompt — was rejected: it can
> send the agent into a retry loop.)

---

## Requirements

- **Node.js** ≥ 18 (to run the CLI via `npx`)
- **opencode** installed and authenticated with ≥ 1 provider (`opencode auth`)
- **spec-kit** (`specify`) — `uv tool install specify-cli` or `pip install specify-cli`

The CLI runs a pre-flight check and tells you exactly what's missing.

---

## Keys (TUI)

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move between rows / models |
| Enter | Open model search (table) / confirm (modal) |
| Type | Filter models (in the modal) |
| Delete / Backspace | Clear the selected step (back to default — "not set"). On the **"Model for all"** row it clears **every** step. |
| S | Save and exit |
| Q | Quit without saving |
| U | Uninstall / revert everything (asks to confirm) |
| Esc | Close the model modal without choosing |

The top **"Model for all"** row applies one model to every step at once.

A step set to **"not set"** has no override: that `/speckit.*` command simply runs
on whatever model you have selected — the native default.

---

## Uninstall / revert

To remove everything with no residue — the global plugin file and your model
map — run:

```
npx speckit-model-router --uninstall
```

It asks for confirmation first; add `--yes` (or `-y`) to skip the prompt in
scripts. You can also press **U** inside the TUI. It deletes exactly two files:

- `~/.config/opencode/plugins/speckit-model-router.js`
- `~/.config/opencode/speckit-models.json`

Your `opencode.json` and any other plugins are left untouched. Restart opencode
once afterwards to unload the plugin from memory.

---

## Architecture

**Functional Core, Imperative Shell.** `src/core/` is pure (no Node IO) and
fully unit-tested; all side-effects live in adapters, UI, and the plugin.

```
src/
├── core/                 PURE, unit-tested
│   ├── steps.ts          the 8 SDD steps
│   ├── layout.ts         responsive table widths + pad()
│   ├── models.ts         parse/filter/paginate/split model ids
│   ├── keys.ts           decodeKey(): raw stdin → semantic action
│   ├── checks.ts         evaluateChecks(): pass/fail + blockers
│   └── modelMap.ts       validate/parse/serialize the per-user model map
├── cli/                  IMPERATIVE SHELL (the configurator)
│   ├── index.ts          bin entry point
│   ├── app.ts            orchestration: checks → install → TUI → save
│   ├── adapters/         paths, opencode (spawn), modelsStore, pluginInstaller
│   └── ui/               terminal, table, modal, checks-view, assignment-screen
└── plugin/
    └── router.ts         the opencode plugin (self-contained; copied to
                          ~/.config/opencode/plugins/ by the CLI)
```

Dependency direction: `cli` and `plugin` may use `core`; `core` depends on
nothing of theirs.

---

## Development

```bash
npm install
npm test         # node:test on the TS sources (Node ≥ 23.6 runs .ts directly)
npm run typecheck
npm run build    # tsc → dist/  (rewrites .ts imports to .js)
```

Tests cover the functional core: responsive layout (incl. the width-68 crash
regression), model parsing/filtering/paging, key decoding (incl. the
left-arrow-as-down regression), checks (blockers vs warnings), and the model map
(validation, parsing, round-trip).

---

## License

MIT

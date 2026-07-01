# rnd-the-fe


### Development

Scripts:

- `pnpm dev` / `pnpm build` / `pnpm preview` — Vite.
- `pnpm typecheck` — regenerates the gql.tada env, then `tsc --noEmit`.
- `pnpm lint` / `pnpm lint:fix` — ESLint (flat config): `typescript-eslint` +
  `eslint-plugin-solid` (catches Solid reactivity foot-guns like destructured props) +
  `eslint-config-prettier`. The generated `src/graphql/graphql-env.d.ts` is ignored.
- `pnpm format` / `pnpm format:check` — Prettier (2-space, 110 print width).

**GraphQL editor tooling (graphqlsp / gql.tada):** inline GraphQL diagnostics + autocomplete
come from the `gql.tada/ts-plugin` (via `@0no-co/graphqlsp`) declared in `tsconfig.json`. For it
to load, your **editor must use the workspace TypeScript version** (VS Code: “TypeScript: Select
TS Version” → *Use Workspace Version*). Run `npx gql.tada doctor` to diagnose setup. After schema
changes, `pnpm schema:pull` / `pnpm schema:introspect` refreshes `graphql-env.d.ts`.

### References

[reference doc](https://docs.google.com/document/d/1kkXyCc2Pf1McYCYDE5_ppvOCMEufVD1E2Z3Rlj0ayPk/edit?tab=t.0#heading=h.gokx2jgewyyw)

[that cli tool Craig suggested](https://github.com/szymdzum/browser-debugger-cli)

[bench-prompt.md](bench-prompt.md)

[reference data file](https://drive.google.com/drive/u/1/folders/1QJnS9_l5PQHUSUOD2ULrthkQMuSZnwQB), stocktake:  019f17d0-1444-795c-ac53-da2216c73cff, store_id: 5B28901C52396E4BB098B9862CCF5DF9, use v3.0.0-RC branch, enable in yaml: `debug_no_access_control: true`.

### Stocktake page

If I (Andrei) was implementing it, I would go step by step, measure performance stats and observing what updates when

* Create basic table
* graphql/codegen
* Filter
* Filter in url parameter
* Add checkbox on each row and delete button, delete button deletes selected row
* Add modal for editings stock lines
* After edits in modal table updates


### Examples of things/areas, as an alternative

* Auth and shell, how it's gated and routed, including initialisation (use this PR)
* Lighter version of JSON forms
* How to use AI for performance tests/evaluation
* Design pattern <-> implementations (how to keep those in sync, leverage AI)
* Plugins with vite
* What packager to use ?

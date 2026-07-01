# Design choices

Short rationale docs for the significant architectural decisions in this rewrite — the *why*, the *costs/
trade-offs*, and the alternatives rejected. Implementation detail lives in `../specs/` and the rules in
`../CLAUDE.md`; these docs explain the reasoning so it isn't re-litigated.

| Doc | Decision |
|-----|----------|
| [framework.md](framework.md) | SolidJS, pinned to stable **1.9** (rolled back from 2.0 beta) |
| [styling.md](styling.md) | **Tailwind v4** utility CSS; logical properties for RTL |
| [theming.md](theming.md) | Semantic **CSS-variable tokens** + `data-theme` + custom themes via `setProperty` |
| [graphql.md](graphql.md) | **gql.tada** (codegen-free, `graphql.web`) over graphql-codegen |
| [data-fetching.md](data-fetching.md) | **@tanstack/solid-query** + per-vertical `api/` layering |
| [tables.md](tables.md) | **TanStack Table v8** (headless) + **solid-virtual** + a custom `DataTable` |
| [routing.md](routing.md) | Typed `ROUTES` + a layout-grouping route registry; file-based-style folders |
| [code-organization.md](code-organization.md) | `components/` presentational · `system/` domain+data · `routes/` screens |
| [ui-primitives.md](ui-primitives.md) | **Kobalte** for accessible headless primitives |
| [i18n.md](i18n.md) | **@solid-primitives/i18n** + native `Intl` + `dir`/logical-CSS RTL |
| [shortcuts.md](shortcuts.md) | Command palette + rebindable keyboard shortcuts |

Overarching goals these serve (from `CLAUDE.md`): small bundle, performance, responsiveness, end-to-end type
safety + maintainability, and velocity for both LLMs and devs.

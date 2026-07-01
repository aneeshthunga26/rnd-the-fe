import solid from "eslint-plugin-solid/configs/typescript";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

// Flat config: typescript-eslint (parser + recommended rules) + eslint-plugin-solid
// (catches reactivity foot-guns like destructured props) + eslint-config-prettier
// last (turns off stylistic rules Prettier owns). The generated gql.tada env file
// is not linted.
export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "src/graphql/graphql-env.d.ts"] },
  ...tseslint.configs.recommended,
  { files: ["**/*.{ts,tsx}"], ...solid },
  // buildRoutes() maps static route config into the tree once at startup — not a
  // reactive list, so <For> doesn't apply here.
  { files: ["src/routes/registry.tsx"], rules: { "solid/prefer-for": "off" } },
  prettier,
);

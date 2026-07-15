import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
  {
    rules: {
      // Server actions commonly use 'any' in catch blocks and raw query results — acceptable
      "@typescript-eslint/no-explicit-any": "warn",
      // require() is used in server-only PDF parse fallback
      "@typescript-eslint/no-require-imports": "warn",
      // Unused vars should be warnings not errors during active development
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      // Polling inside useEffect with setInterval is an accepted pattern for live updates
      "react-hooks/set-state-in-effect": "warn",
      // Unescaped entities are safe in plain text content
      "react/no-unescaped-entities": "warn",
      // Allow missing deps in effects that use stable function refs
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;

const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const eslintPluginImport = require("eslint-plugin-import");
const eslintPluginSecurity = require("eslint-plugin-security");

module.exports = [
  // Replaces .eslintignore
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      // generated/vendor (don’t lint for HW)
      "prisma/**",
      "src/generated/**",
      "**/generated/**",
      "**/runtime/**",
      "**/*.min.js",
      "**/*wasm*.js",
      "**/*.wasm",
      // non-source config files
      "eslint.config.*",
      "postcss.config.*",
      "tailwind.config.*",
      "next.config.*",
      "vite.config.*",
      "vitest.config.*",
      "webpack.config.*",
      "rollup.config.*",
    ],
  },

  // JS/JSX files: plain JS rules
  {
    files: ["**/*.{js,jsx}"],
    ...js.configs.recommended,
    plugins: { import: eslintPluginImport, security: eslintPluginSecurity },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      "security/detect-object-injection": "warn",
      "import/no-unresolved": "error",
    },
  },

  // TS/TSX files: TypeScript parser + type-aware rules (ONLY for TS files)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: eslintPluginImport,
      security: eslintPluginSecurity,
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "security/detect-object-injection": "warn",
      "import/no-unresolved": "error",
    },
  },
];

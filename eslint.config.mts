import type { Plugin } from "@eslint/core";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import typescriptPaths from "eslint-plugin-typescript-paths";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

const root = import.meta.dirname;
const pattern = `{js,mjs,cjs,ts,mts,cts}`;

export default defineConfig([
	globalIgnores([
		".wrangler",
		"bundled",
		"dist",
		"worker-configuration.d.ts",
	]),
	{
		files: [`**/*.${pattern}`],
		plugins: {
			js,
			"simple-import-sort": simpleImportSort,
			"unused-imports": unusedImports,
		},
		extends: ["js/recommended"],
		languageOptions: {
			globals: globals.worker,
		},
	},
	{
		files: [`test/**/*.${pattern}`],
		languageOptions: {
			globals: {
				...globals.node,
				Bun: false,
			},
		},
	},
	{
		files: [`src/**/*.${pattern}`],
		plugins: {
			"typescript-paths": typescriptPaths as Plugin,
		},
		rules: {
			"typescript-paths/absolute-import": ["warn", { enableAlias: false }],
			"typescript-paths/absolute-parent-import": ["warn", { preferPathOverBaseUrl: true }],
		},
	},
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: root,
			},
		},
	},
	{
		rules: {
			"unused-imports/no-unused-imports": "error",
			"simple-import-sort/imports": "warn",
			"simple-import-sort/exports": "warn",

			"@typescript-eslint/dot-notation": "error",
			"@typescript-eslint/no-unused-vars": ["error", {
				"varsIgnorePattern": "^_",
				"argsIgnorePattern": "^_",
				"ignoreRestSiblings": true,
			}],
			"@typescript-eslint/prefer-optional-chain": "error",
			"@typescript-eslint/prefer-string-starts-ends-with": "error",

			"eqeqeq": "error",
			"new-cap": "error",
			"no-array-constructor": "error",
			"no-inner-declarations": "error",
			"no-unneeded-ternary": "error",
			"no-useless-concat": "error",
			"prefer-template": "error",
			"require-atomic-updates": "error",
			"yoda": "error",

			"no-control-regex": "off",
			"no-unused-vars": "off",
			"sort-imports": "off",
		},
	},
]);

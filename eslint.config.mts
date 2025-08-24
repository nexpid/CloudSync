import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
	globalIgnores([
		".wrangler",
		"bundled",
		"dist",
		"worker-configuration.d.ts",
	]),
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
		plugins: {
			js,
			"simple-import-sort": simpleImportSort,
		},
		extends: ["js/recommended"],
		languageOptions: {
			globals: globals.worker,
		},
	},
	{
		files: ["test/**/*.{js,mjs,cjs,ts,mts,cts}"],
		languageOptions: {
			globals: {
				...globals.node,
				Bun: false,
			},
		},
	},
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				// @ts-expect-error Too much yapping
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",

			"@typescript-eslint/no-unused-vars": ["error", {
				"varsIgnorePattern": "^_",
				"argsIgnorePattern": "^_",
				"ignoreRestSiblings": true,
			}],

			"yoda": "error",
			"no-control-regex": "off",
			"no-unused-vars": "off",
			"sort-imports": "off",
		},
	},
]);

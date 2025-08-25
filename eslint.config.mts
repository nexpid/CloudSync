import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

// @ts-expect-error import.meta is allowed
const root = import.meta.dirname;

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
			"unused-imports": unusedImports,
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
				tsconfigRootDir: root,
			},
		},
	},
	{
		rules: {
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
			"unused-imports/no-unused-imports": "error",

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

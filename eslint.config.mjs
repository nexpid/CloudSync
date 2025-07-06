import * as js from "@eslint/js";
import * as tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

module.exports = defineConfig([{
	languageOptions: {
		parser: tsParser,
		sourceType: "module",

		parserOptions: {
			project: "tsconfig.json",
			tsconfigRootDir: __dirname,
		},

		globals: {
			...globals.node,
		},
	},

	plugins: {
		"@typescript-eslint": typescriptEslintPlugin,
	},

	extends: compat.extends("plugin:@typescript-eslint/recommended"),

	rules: {
		"@typescript-eslint/interface-name-prefix": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/no-explicit-any": "off",
	},
}]);

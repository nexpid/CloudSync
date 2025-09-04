import type { ConfigExport } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default {
	input: {
		handlers: "./src/handlers/index.ts",
		structs: "./src/structs/index.ts",
	},
	platform: "node",
	external: ["zod"],
	plugins: [dts()],
	tsconfig: "./tsconfig.json",
	output: {
		entryFileNames: "[name].js",
		format: "esm",
		sourcemap: "hidden",
	},
} as ConfigExport;

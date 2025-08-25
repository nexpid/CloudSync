import { formatWithOptions } from "node:util";

export function table(obj: object) {
	return process.env.ENVIRONMENT === "local"
		? formatWithOptions({
			depth: Infinity,
			colors: true,
		}, obj)
		: obj;
}

export function log(
	level: "info" | "warn" | "error",
	message: string,
	context?: Record<string, unknown>,
) {
	const logEntry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...context,
	};

	if (level === "error") {
		console.error(table(logEntry));
	} else if (level === "warn") {
		console.warn(table(logEntry));
	} else {
		console.log(table(logEntry));
	}
}

export const logger = {
	info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
	warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
	error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};

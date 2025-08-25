import { formatWithOptions } from "node:util";

export function table(obj: object) {
	return !IS_PRODUCTION
		? formatWithOptions({
			depth: Infinity,
			colors: true,
		}, obj)
		: obj;
}

function cleanContext(context: Record<string, unknown>) {
	for (const [key, value] of Object.entries(context)) {
		if (value instanceof Error) context[key] = value.stack ?? value.message;
		else if (value && typeof value === "object" && !Array.isArray(value)) {
			cleanContext(value as Record<string, unknown>);
		}
	}
	return context;
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
		context: context ? cleanContext(context) : null,
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

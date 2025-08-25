import { cloudflareRateLimiter } from "@hono-rate-limiter/cloudflare";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { getUser, TokenPayload } from "src/lib/auth";
import {
	deleteUserData,
	getUserData,
	retrieveUserData,
	saveUserData,
	UserDataSchema,
} from "src/lib/db";
import { decompressData } from "src/lib/db/conversion";
import { HttpStatus } from "src/lib/http-status";
import { prettifyError } from "zod";

import { logger } from "../lib/logger";

interface HonoConfig {
	Variables: {
		user: TokenPayload;
	};
	Bindings: Env;
}

const data = new Hono<HonoConfig>();

// Authorization middleware
data.use(async (c, next) => {
	// Used as a bypass for iOs users on /raw, since RNFS is missing so the file can't be downloaded with code
	const user = await getUser(c.req.header("Authorization") ?? c.req.query("auth"));
	if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

	c.set("user", user);
	await next();
});

// Ratelimit middleware
data.use(cloudflareRateLimiter<HonoConfig>({
	rateLimitBinding(c) {
		return c.env.USER_RATELIMIT;
	},
	keyGenerator(c) {
		return c.get("user").userId;
	},
}));

data.get("/", async function getData(c) {
	const userId = c.get("user").userId;

	const data = await getUserData(userId);
	c.header("Last-Modified", data.at);
	return c.json(data?.data || null);
});

data.put(
	"/",
	validator("json", (value, c) => {
		const parsed = UserDataSchema.safeParse(value);
		if (parsed.error) {
			return c.text(prettifyError(parsed.error), HttpStatus.BAD_REQUEST);
		}

		return parsed.data;
	}),
	async function saveData(c) {
		const userId = c.get("user").userId;
		const data = c.req.valid("json");

		await saveUserData(userId, data, new Date().toISOString());
		return c.json(true);
	},
);

data.delete("/", async function deleteData(c) {
	const userId = c.get("user").userId;

	await deleteUserData(userId);
	return c.json(true);
});

data.get("/raw", async function downloadData(c) {
	const userId = c.get("user").userId;

	const data = await retrieveUserData(userId);
	if (!data) return c.body(null, HttpStatus.NO_CONTENT);

	const today = new Date().toISOString().replace(/T/, "_").replace(/:/g, "").replace(/\..+$/, "");

	c.header("Content-Type", "text/plain");
	c.header(
		"Content-Disposition",
		`attachment; filename="CloudSync-${today}.txt"`,
	);
	c.header("Last-Modified", data.at);
	return c.text(data.data);
});

data.post("/decompress", async function decompressRawData(c) {
	const userId = c.get("user").userId;
	const rawData = await c.req.text();

	try {
		Buffer.from(rawData, "base64"); // make sure data is base64
		return c.json(await decompressData(rawData));
	} catch (error) {
		logger.warn("Decompress data failed", { userId, error });
		return c.text(`Failed to decompress: ${String(error)}`, HttpStatus.BAD_REQUEST);
	}
});

export default data;

import { cloudflareRateLimiter } from "@hono-rate-limiter/cloudflare";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { getUser, TokenPayload } from "src/lib/auth";
import { deleteUserData, getUserData, saveUserData, UserDataSchema } from "src/lib/db";
import { HttpStatus } from "src/lib/http-status";
import { validateSong } from "src/lib/songs/validate";
import { prettifyError } from "zod";

interface HonoConfig {
	Variables: {
		user: TokenPayload;
	};
	Bindings: Env;
}

const data = new Hono<HonoConfig>();

const DISCORD_EPOCH = 1420070400000;

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

data.get("/:id", async function listData(c) {
	const id = c.req.param("id");

	// validate snowflake based on https://github.com/vegeta897/snow-stamp/blob/8908d48bcee4883a7c4146bb17aa73b73a9009ba/src/convert.js
	if (!Number.isInteger(id)) {
		return c.text("User ID is not a valid snowflake", HttpStatus.BAD_REQUEST);
	}

	const snowflake = BigInt(id) >> 22n;
	if (snowflake < 2592000000n) {
		return c.text("User ID is not a valid snowflake", HttpStatus.BAD_REQUEST);
	}

	const biggest = BigInt(Date.now() - DISCORD_EPOCH) << 22n;
	if (snowflake > biggest) {
		return c.text("User ID is not a valid snowflake", HttpStatus.BAD_REQUEST);
	}

	if (Number.isNaN(new Date(Number(snowflake) + DISCORD_EPOCH).getTime())) {
		return c.text("User ID is not a valid snowflake", HttpStatus.BAD_REQUEST);
	}

	const data = await getUserData(id);

	c.header("Last-Modified", data.at);
	return c.json(data.data);
});

data.put(
	"/",
	validator("json", (value, c) => {
		const parsed = UserDataSchema.safeParse(value);
		if (parsed.error) {
			return c.text(prettifyError(parsed.error), HttpStatus.BAD_REQUEST);
		}

		return parsed.data.filter((x, i) => !parsed.data.slice(0, i).includes(x));
	}),
	async function saveData(c) {
		const userId = c.get("user").userId;
		const data = c.req.valid("json");

		const allValidated = await Promise.all(
			data.map((song) => validateSong(song)),
		);
		if (!allValidated.every((x) => x === true)) {
			return c.json(allValidated.map((valid, i) => [valid, data[i]]));
		}

		await saveUserData(userId, data, new Date().toISOString());
		return c.json(true);
	},
);

data.delete("/", async function deleteData(c) {
	const userId = c.get("user").userId;

	await deleteUserData(userId);
	return c.json(true);
});

export default data;

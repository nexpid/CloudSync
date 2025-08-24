import { Hono } from "hono";
import { validator } from "hono/validator";
import { getUser } from "src/lib/auth";
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

const data = new Hono<{ Bindings: Env }>();

data.get("/", async function getData(c) {
	const user = await getUser(c.req.header("Authorization"));
	if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

	try {
		const data = await getUserData(user.userId);

		c.header("Last-Modified", data?.at);
		return c.json(data?.data || null);
	} catch (e) {
		return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
	}
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
		const data = c.req.valid("json");

		const user = await getUser(c.req.header("Authorization"));
		if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

		try {
			await saveUserData(user.userId, data, new Date().toUTCString());
			return c.json(true);
		} catch (e) {
			return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	},
);

data.delete("/", async function deleteData(c) {
	const user = await getUser(c.req.header("Authorization"));
	if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

	try {
		await deleteUserData(user.userId);
		return c.json(true);
	} catch (e) {
		return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
	}
});

data.get("/raw", async function downloadData(c) {
	// Used as a bypass for iOs users, since RNFS is missing so the file can't be downloaded with code
	const user = await getUser(
		c.req.header("Authorization") ?? c.req.query("auth"),
	);
	if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

	try {
		const data = await retrieveUserData(user.userId);
		if (!data) return c.body(null, HttpStatus.NO_CONTENT);

		const today = new Date().toISOString().replace(/T/, "_").replace(/:/g, "").replace(/\..+$/, "");

		c.header("content-type", "text/plain");
		c.header(
			"content-disposition",
			`attachment; filename="CloudSync-${today}.txt"`,
		);
		c.header("last-modified", data.at);
		return c.text(data.data);
	} catch (e) {
		return c.text(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
	}
});

data.post("/decompress", async function decompressRawData(c) {
	const user = await getUser(c.req.header("Authorization"));
	if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

	const rawData = await c.req.text();

	try {
		Buffer.from(rawData, "base64"); // make sure data is base64
		return c.json(await decompressData(rawData));
	} catch (e) {
		return c.text(String(e), HttpStatus.BAD_REQUEST);
	}
});

export default data;

import { promisify } from "node:util";
import {
	brotliCompress as _brotliCompress,
	brotliDecompress as _brotliDecompress,
} from "node:zlib";

import { UserData, UserDataSchema } from ".";

const latestDataVersion = "2";

const brotliCompress = promisify(_brotliCompress);
const brotliDecompress = promisify(_brotliDecompress);

const noInvalidChars = /[\n\x00\x01]/g;

function stripNoCloudSync(obj: unknown) {
	if (obj && typeof obj === "object") {
		if (Array.isArray(obj)) {
			const filtered = [];
			for (const val of obj) {
				const rep = stripNoCloudSync(val);
				if (rep !== undefined) filtered.push(rep);
			}

			return filtered as unknown[];
		} else {
			// deprecated
			if ("__no_cloud_sync" in obj) return undefined;
			if ("__no_sync" in obj) return undefined;

			const filtered = {};
			for (const [key, value] of Object.entries(obj)) {
				const rep = stripNoCloudSync(value);
				if (rep !== undefined) filtered[key] = rep;
			}

			return filtered;
		}
	} else return obj;
}

export function reconstruct(data: string) {
	const [version, plugins, themes, installedFonts, customFonts, ...incorrect] = data
		.split("\n");
	if (incorrect.length > 1 || version !== latestDataVersion) return;

	const dataObj: UserData = {
		plugins: {},
		themes: {},
		fonts: {
			installed: {},
			custom: [],
		},
	};

	for (const plugin of plugins.split("\x01")) {
		const stuff = plugin.split("\x00");
		const url = stuff[0];
		if (!url) continue;
		let [enabled, storage] = stuff.slice(1);

		if (enabled && enabled !== "1") {
			storage = enabled;
			enabled = null;
		}

		try {
			new URL(url);
			if (storage) JSON.parse(storage);
		} catch {
			continue;
		}

		dataObj.plugins[url] = {
			enabled: Boolean(enabled),
			storage: storage || "{}",
		};
	}

	for (const font of customFonts.split("\x01")) {
		const [spec, src, enabled] = font.split("\x00");
		if (Number.isNaN(Number(spec)) || !src) continue;

		let raw: object;
		try {
			raw = JSON.parse(src) as object;
		} catch {
			continue;
		}

		dataObj.fonts.custom.push({
			spec: Number(spec),
			enabled: enabled === "1",
			...raw,
		});
	}

	for (const theme of themes.split("\x01")) {
		const [url, enabled] = theme.split("\x00");
		if (!url) continue;

		try {
			new URL(url);
		} catch {
			continue;
		}

		dataObj.themes[url] = {
			enabled: enabled === "1",
		};
	}

	for (const font of installedFonts.split("\x01")) {
		const [url, enabled] = font.split("\x00");
		if (!url) continue;

		try {
			new URL(url);
		} catch {
			continue;
		}

		dataObj.fonts.installed[url] = {
			enabled: enabled === "1",
		};
	}

	return dataObj;
}

export function deconstruct(data: UserData) {
	const { error } = UserDataSchema.safeParse(data);
	if (error) throw error;

	const chunks = new Array<string>();
	chunks.push(latestDataVersion); // data version, used for major data structure changes

	const pluginChunks = new Array<string>();
	const themeChunks = new Array<string>();
	const installedFontChunks = new Array<string>();
	const customFontChunks = new Array<string>();

	// PLUGINS
	for (const url of Object.keys(data.plugins)) {
		const { enabled, storage } = data.plugins[url];
		const subChunks = new Array<string>();

		subChunks.push(url.replace(noInvalidChars, ""));
		if (enabled) subChunks.push("1");

		const dt = storage && stripNoCloudSync(JSON.parse(storage));
		if (dt && Boolean(Object.keys(dt).length)) {
			subChunks.push(JSON.stringify(dt).replace(noInvalidChars, ""));
		}

		pluginChunks.push(subChunks.join("\x00"));
	}

	// CUSTOM FONTS
	for (const font of data.fonts.custom) {
		const subChunks = new Array<string>();

		const fontData = { ...font };
		delete fontData.enabled;
		delete fontData.spec;

		subChunks.push(String(font.spec));
		subChunks.push(JSON.stringify(fontData));
		if (font.enabled) subChunks.push("1");

		customFontChunks.push(subChunks.join("\x00"));
	}

	// THEMES
	for (const url of Object.keys(data.themes)) {
		const enabled = data.themes[url].enabled;
		const subChunks = new Array<string>();

		subChunks.push(url.replace(noInvalidChars, ""));
		if (enabled) subChunks.push(enabled ? "1" : "0");

		themeChunks.push(subChunks.join("\x00"));
	}

	// INSTALLED FONTS
	for (const url of Object.keys(data.fonts.installed)) {
		const enabled = data.fonts.installed[url].enabled;
		const subChunks = new Array<string>();

		subChunks.push(url.replace(noInvalidChars, ""));
		if (enabled) subChunks.push("1");

		installedFontChunks.push(subChunks.join("\x00"));
	}

	chunks.push(
		pluginChunks.join("\x01"),
		themeChunks.join("\x01"),
		installedFontChunks.join("\x01"),
		customFontChunks.join("\x01"),
	);

	return chunks.join("\n");
}

export async function compressData(data: UserData) {
	return (await brotliCompress(deconstruct(data))).toString("base64");
}

export function decompressData(data: string, decompOnly: true): Promise<string>;
export function decompressData(
	data: string,
	decompOnly?: false,
): Promise<UserData>;

export async function decompressData(
	data: string,
	decompOnly: boolean = false,
) {
	const decomp = (
		await brotliDecompress(Buffer.from(data, "base64"))
	).toString();

	if (decompOnly === true) return decomp;
	else return reconstruct(decomp);
}

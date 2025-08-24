import { exists, mkdir, rm } from "node:fs/promises";
import { brotliCompressSync, brotliDecompressSync } from "node:zlib";

import type { UserData } from "../../src/lib/db";
import { deconstruct, reconstruct } from "../../src/lib/db/conversion";

const basePluginRoot = "https://bn-plugins.github.io/vd-proxy/user.github.io/plugins/";
const baseThemeRoot = "https://raw.githubusercontent.com/user/themes/main/";
const baseFontRoot = "https://raw.githubusercontent.com/user/fonts/main/";

const mockData: UserData = {
	plugins: Object.fromEntries(
		new Array(60).fill(0).map(() => [
			`${basePluginRoot}${crypto.randomUUID()}`,
			{
				enabled: Math.random() < 0.5,
				storage: JSON.stringify(
					Object.fromEntries(
						Object.entries({
							someValue: 0,
							thing: true,
							someOtherProperty: false,
							extremelyLongPropertyName: {
								enabled: true,
								bumpscosity: Math.random(),
							},
							yetAnotherProperty: [Math.random(), false, "Hi!"],
						}).filter(() => Math.random() < 0.5),
					),
				),
			},
		]),
	),
	themes: Object.fromEntries(
		new Array(10).fill(0).map(() => [
			`${baseThemeRoot}${crypto.randomUUID()}.json`,
			{
				enabled: Math.random() < 0.5,
			},
		]),
	),
	fonts: {
		installed: Object.fromEntries(
			new Array(10)
				.fill(0)
				.map(() => [
					`${baseFontRoot}${crypto.randomUUID()}.json`,
					{ enabled: Math.random() < 0.5 },
				]),
		),
		custom: new Array(1).fill(0).map(() => ({
			spec: 2,
			name: crypto.randomUUID(),
			previewText: new Array(Math.floor(Math.random() * 5) + 1)
				.fill(0)
				.map(() => crypto.randomUUID())
				.join(""),
			main: Object.fromEntries(
				new Array(12)
					.fill(0)
					.map(() => [
						crypto.randomUUID(),
						`${baseFontRoot}/${crypto.randomUUID()}.ttf`,
					]),
			),
			enabled: Math.random() < 0.5,
		})),
	},
};

const byteSizer = (len: number) => {
	if (len < 1e3) return `${len} B`;
	else if (len < 1e6) return `${(len / 1e3).toFixed(1)} KB`;
	else return `${(len / 1e6).toFixed(1)} MB`;
};

const rawData = JSON.stringify(mockData);
const str = deconstruct(mockData);
const brotli = brotliCompressSync(str);

const compare = (a: string | Buffer, b: string | Buffer) => {
	const siz = Buffer.byteLength(a);
	const sizB = Buffer.byteLength(b);

	const change = -(100 - Math.floor((siz / sizB) * 100));
	return `${byteSizer(siz)} (${change > 0 ? "+" : ""}${change}%)`;
};

console.log("Raw data size:", byteSizer(Buffer.byteLength(rawData)));
console.log("Basic compressed data size:", compare(str, rawData));

console.log();

console.log("Brotli compressed data size:", compare(brotli, str));
console.log(
	"Base64 brotli compressed data size:",
	compare(brotli.toString("base64"), str),
);

console.log();

if (await exists("test/mock")) await rm("test/mock", { recursive: true, force: true });
await mkdir("test/mock");
await Bun.write("test/mock/raw-data.json", rawData);
await Bun.write("test/mock/basic-compressed-data.txt", str);
await Bun.write("test/mock/brotli-compressed-data.txt", brotli.toString("base64"));

let greatSuccess = true;
try {
	reconstruct(
		brotliDecompressSync(
			Buffer.from(await Bun.file("test/mock/brotli-compressed-data.txt").text(), "base64"),
		).toString(),
	);
} catch {
	greatSuccess = false;
}

console.log(
	`Did we pass the brotli write → read check? ... ${greatSuccess ? "yes!" : "no.."}`,
);

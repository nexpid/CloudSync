import { exists, mkdir, rm } from "node:fs/promises";
import { brotliCompressSync, brotliDecompressSync } from "node:zlib";

import { deconstruct, reconstruct } from "../../src/lib/db/conversion";
import { mockData } from "./makedata.test";

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
	const recon = reconstruct(
		brotliDecompressSync(
			Buffer.from(await Bun.file("test/mock/brotli-compressed-data.txt").text(), "base64"),
		).toString(),
	);
	await Bun.write(
		"test/mock/out-data.json",
		JSON.stringify(recon),
	);

	greatSuccess = Bun.deepEquals(mockData, recon);
} catch {
	greatSuccess = false;
}

console.log(
	`Did we pass the brotli write → read check? ... ${greatSuccess ? "yes!" : "no.."}`,
);

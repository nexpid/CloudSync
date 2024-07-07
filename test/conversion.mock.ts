import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { deconstruct, reconstruct } from "../src/lib/db/conversion";
import { UserData } from "../src/lib/db/db.service";
import { brotliCompressSync, brotliDecompressSync } from "zlib";

const basePluginRoot =
  "https://bn-plugins.github.io/vd-proxy/user.github.io/plugins/";
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

const compare = (a: any, b: any) => {
  const siz = Buffer.byteLength(a);
  const sizB = Buffer.byteLength(b);

  const change = 100 - Math.floor((siz / sizB) * 100);
  return `${byteSizer(siz)} (${change > 0 ? "-" : "+"}${change}%)`;
};

console.log("Old data size:", byteSizer(Buffer.byteLength(rawData)));
console.log("New data size:", compare(str, rawData));
console.log("New brotli compressed data size:", compare(brotli, str));

if (!existsSync("mock")) mkdirSync("mock");
writeFileSync("mock/raw-data.json", rawData);
writeFileSync("mock/data.txt", str);
writeFileSync("mock/compressed-data.txt", brotli);

let greatSuccess = true;
try {
  reconstruct(
    brotliDecompressSync(readFileSync("mock/compressed-data.txt")).toString(),
  );
} catch {
  greatSuccess = false;
}

console.log(
  `\nDid we pass the write → read check? ... ${greatSuccess ? "yes!" : "no.."}`,
);

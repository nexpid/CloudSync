import {
  brotliCompress as _brotliCompress,
  brotliDecompress as _brotliDecompress,
} from "zlib";
import { UserData, UserDataSchema } from "./db.service";
import { promisify } from "util";

const brotliCompress = promisify(_brotliCompress);
const brotliDecompress = promisify(_brotliDecompress);

const noInvalidChars = /[\n\u0000\u0001]/g;

const stripNoCloudSync = (obj: any) => {
  if (obj && typeof obj === "object") {
    if ("__no_cloud_sync" in obj) return undefined;

    for (const key of Object.keys(obj)) {
      const val = stripNoCloudSync(obj[key]);
      if (val === undefined) delete obj[key];
      else obj[key] = val;
    }
  }
  return obj;
};

export function reconstruct(data: string) {
  const [version, plugins, themes, installedFonts, customFonts, ...incorrect] =
    data.split("\n");
  if (incorrect.length > 1 || version !== "2") return;

  const dataObj: UserData = {
    plugins: {},
    themes: {},
    fonts: {
      installed: {},
      custom: [],
    },
  };

  for (const plugin of plugins.split("\u0001")) {
    const stuff = plugin.split("\u0000");
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
      enabled: enabled === "1",
      storage,
    };
  }

  for (const font of customFonts.split("\u0001")) {
    const [spec, src, enabled] = font.split("\u0000");
    if (Number.isNaN(Number(spec)) || !src) continue;

    let dt: any;
    try {
      dt = JSON.parse(src);
    } catch {
      continue;
    }

    dataObj.fonts.custom.push({
      spec: Number(spec),
      enabled: enabled === "1",
      ...dt,
    });
  }

  for (const theme of themes.split("\u0001")) {
    const [url, enabled] = theme.split("\u0000");
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

  for (const font of installedFonts.split("\u0001")) {
    const [url, enabled] = font.split("\u0000");
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
  const { error } = UserDataSchema.validate(data);
  if (error) throw error;

  const chunks = new Array<string>();
  chunks.push("2"); // data version, used for major data structure changes

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

    const dt = stripNoCloudSync(JSON.parse(storage));
    if (dt && Boolean(Object.keys(dt).length))
      subChunks.push(JSON.stringify(dt).replace(noInvalidChars, ""));

    pluginChunks.push(subChunks.join("\u0000"));
  }

  // CUSTOM FONTS
  for (const font of data.fonts.custom) {
    const subChunks = new Array<string>();

    const fontData = { ...font };
    delete fontData.enabled;
    delete fontData.spec;

    subChunks.push(font.spec.toString());
    subChunks.push(JSON.stringify(fontData));
    if (font.enabled) subChunks.push("1");

    customFontChunks.push(subChunks.join("\u0000"));
  }

  // THEMES
  for (const url of Object.keys(data.themes)) {
    const enabled = data.themes[url].enabled;
    const subChunks = new Array<string>();

    subChunks.push(url.replace(noInvalidChars, ""));
    if (enabled) subChunks.push(enabled ? "1" : "0");

    themeChunks.push(subChunks.join("\u0000"));
  }

  // INSTALLED FONTS
  for (const url of Object.keys(data.fonts.installed)) {
    const enabled = data.fonts.installed[url].enabled;
    const subChunks = new Array<string>();

    subChunks.push(url.replace(noInvalidChars, ""));
    if (enabled) subChunks.push("1");

    installedFontChunks.push(subChunks.join("\u0000"));
  }

  chunks.push(
    pluginChunks.join("\u0001"),
    themeChunks.join("\u0001"),
    installedFontChunks.join("\u0001"),
    customFontChunks.join("\u0001"),
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

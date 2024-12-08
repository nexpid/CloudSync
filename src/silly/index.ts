import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import { SillyService } from "./service";
import { env } from "src/lib/env";
import {
  CDNRoutes,
  ImageFormat,
  RouteBases,
  Routes,
} from "discord-api-types/v10";

let initiated = false,
  doingSilly = false;

const description = `Syncs your Bunny plugins, themes and fonts to the cloud!
« https://github.com/nexpid/CloudSync »
« https://bunny.nexpid.xyz/cloud-sync »
« https://discord.gg/ddcQf3s2Uq »`;

export async function runSilly() {
  if (!env.CLIENT_TOKEN) return console.debug({ silly: { enabled: false } });

  if (doingSilly) return console.warn({ silly: { busy: true } });

  doingSilly = true;
  if (!initiated) {
    try {
      await initWasm(resvgWasm);
      initiated = true;
    } catch (error) {
      console.error({ silly: { resvg: false, error } });
      return (doingSilly = false);
    }
  }

  const colors = SillyService.getRandomColors();

  const icon = SillyService.getIcon()
    .replace(/#FF0000/g, colors.bg)
    .replace(/#00FF00/g, colors.cloud)
    .replace(/#0000FF/g, colors.cloudOutline);
  const banner = SillyService.getBanner()
    .replace(/#FF0000/g, colors.bg)
    .replace(/#00FF00/g, colors.cloud)
    .replace(/#0000FF/g, colors.cloudOutline);

  const iconSvg =
    "data:image/png;base64," +
    Buffer.from(
      new Resvg(icon, {
        fitTo: { mode: "width", value: 512 },
        font: { loadSystemFonts: false },
        shapeRendering: 2,
      })
        .render()
        .asPng(),
    ).toString("base64");
  const bannerSvg =
    "data:image/png;base64," +
    Buffer.from(
      new Resvg(banner, {
        fitTo: { mode: "width", value: 680 },
        font: { loadSystemFonts: false },
        shapeRendering: 2,
      })
        .render()
        .asPng(),
    ).toString("base64");
  const ftpe = SillyService.getFtpe(colors.cloud, colors.bg);

  // "Bot " is included in the token
  const id = env.CLIENT_ID,
    token = env.CLIENT_TOKEN;
  const changedIconReq = await fetch(RouteBases.api + `/applications/${id}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({
      icon: iconSvg,
      description: `${description}${ftpe}`,
    }),
  });
  const changedIcon = await changedIconReq.json<any>();

  const changedBannerReq = await fetch(RouteBases.api + Routes.user(), {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({
      banner: bannerSvg,
    }),
  });
  const changedBanner = await changedBannerReq.json<any>();

  doingSilly = false;

  if (!changedIcon?.id || !changedBanner?.id)
    return console.error({
      silly: {
        logs: [changedIcon, changedBanner].filter((x) => !x.id),
        ratelimits: [
          [...changedIconReq.headers.entries()],
          [...changedBannerReq.headers.entries()],
        ].filter((req) =>
          Object.fromEntries(
            req.filter(([prop]) =>
              ["retry-after", "ratelimit"].some((key) =>
                prop.toLowerCase().includes(key),
              ),
            ),
          ),
        ),
        success: false,
      },
    });
  else
    return console.debug({
      silly: {
        colors,
        banner:
          RouteBases.cdn +
          CDNRoutes.userBanner(id, changedBanner.banner, ImageFormat.PNG),
        avatar:
          RouteBases.cdn +
          CDNRoutes.userAvatar(id, changedBanner.avatar, ImageFormat.PNG),
        icon:
          RouteBases.cdn +
          CDNRoutes.applicationIcon(id, changedIcon.icon, ImageFormat.PNG),
        ftpe,
        success: true,
      },
    });
}

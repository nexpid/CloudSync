import {
  Controller,
  Get,
  Header,
  Headers,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { SillyService } from "./silly.service";
import { ConfigService } from "@nestjs/config";
import { Resvg } from "@resvg/resvg-js";
import {
  CDNRoutes,
  ImageFormat,
  RouteBases,
  Routes,
} from "discord-api-types/v10";

let stillTooSilly = false;

const description = `Syncs your Bunny plugins, themes and fonts to the cloud!
« https://github.com/nexpid/CloudSync »
« https://bunny.nexpid.xyz/cloud-sync »
« https://discord.gg/ddcQf3s2Uq »`;

@Controller("api/silly")
export class SillyController {
  constructor(
    private readonly configService: ConfigService,
    private readonly sillyService: SillyService,
  ) {}

  @Get()
  @Header("cache-control", "max-age=604800")
  @Header("content-type", "text/html")
  async getData(@Res() res: Response, @Headers("authorization") auth: string) {
    if (!this.configService.get("CLIENT_TOKEN"))
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send("silliness is not enabled!!");

    if (
      process.env.VERCEL &&
      auth !== `Bearer ${this.configService.get("CRON_SECRET")}`
    )
      return res.status(HttpStatus.UNAUTHORIZED).send("Silliness is forbidden");

    if (stillTooSilly)
      return res.status(HttpStatus.NOT_FOUND).send("currently too silly!!!");

    stillTooSilly = true;

    const colors = this.sillyService.getRandomColors();

    const icon = this.sillyService
      .getIcon()
      .replace(/#FF0000/g, colors.bg)
      .replace(/#00FF00/g, colors.cloud)
      .replace(/#0000FF/g, colors.cloudOutline);
    const banner = this.sillyService
      .getBanner()
      .replace(/#FF0000/g, colors.bg)
      .replace(/#00FF00/g, colors.cloud)
      .replace(/#0000FF/g, colors.cloudOutline);

    const iconSvg =
      "data:image/png;base64," +
      new Resvg(icon, {
        fitTo: { mode: "width", value: 512 },
      })
        .render()
        .asPng()
        .toString("base64");
    const bannerSvg =
      "data:image/png;base64," +
      new Resvg(banner, {
        fitTo: { mode: "width", value: 680 },
      })
        .render()
        .asPng()
        .toString("base64");
    const ftpe = this.sillyService.getFtpe(colors.cloud, colors.bg);

    // "Bot " is included in the token
    const id = this.configService.get("CLIENT_ID"),
      token = this.configService.get("CLIENT_TOKEN");
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
    const changedIcon = await changedIconReq.json();

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
    const changedBanner = await changedBannerReq.json();

    stillTooSilly = false;

    if (!changedIcon?.id || !changedBanner?.id)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
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
      });
    else
      return res.json({
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
      });
  }
}

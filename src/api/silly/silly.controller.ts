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
import { Routes } from "discord-api-types/v10";

let stillTooSilly = false;

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

    const changed = await (
      await fetch(`https://discord.com/api/v10${Routes.user("@me")}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bot ${this.configService.get("CLIENT_TOKEN")}`,
        },
        body: JSON.stringify({
          avatar: iconSvg,
          banner: bannerSvg,
        }),
      })
    ).json();

    stillTooSilly = false;

    if (!changed?.id)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(changed);
    else return res.send("Yay!");
  }
}

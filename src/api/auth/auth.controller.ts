import { Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { Response } from "express";
import {
  RESTGetAPICurrentUserResult,
  RESTPostOAuth2AccessTokenResult,
  Routes,
} from "discord-api-types/v10";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";

@Controller("api/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get("/authorize")
  async authorizeFromDiscord(
    @Query("code") code: string,
    @Res() res: Response,
  ) {
    if (!code)
      return res.status(HttpStatus.BAD_REQUEST).send("No code provided");

    let accessToken: RESTPostOAuth2AccessTokenResult;
    try {
      accessToken = await (
        await fetch(
          `https://discord.com/api/v10${Routes.oauth2TokenExchange()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: this.configService.get("CLIENT_ID"),
              client_secret: this.configService.get("CLIENT_SECRET"),
              code,
              grant_type: "authorization_code",
              redirect_uri: !process.env.VERCEL
                ? this.configService.get("LOCAL_REDIRECT_URI")
                : this.configService.get("REDIRECT_URI"),
              scope: "identify",
            }),
          },
        )
      ).json();
    } catch {
      return res.status(HttpStatus.BAD_REQUEST).send("Invalid OAuth2 code");
    }

    if (!accessToken.access_token)
      return res.status(HttpStatus.BAD_REQUEST).send("Invalid OAuth2 code");

    const { id } = (await (
      await fetch(`https://discord.com/api/v10${Routes.user("@me")}`, {
        headers: {
          authorization: `${accessToken.token_type} ${accessToken.access_token}`,
        },
      })
    ).json()) as RESTGetAPICurrentUserResult;

    return res.send(await this.authService.createToken(id));
  }
}

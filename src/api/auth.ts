import {
  RESTGetAPICurrentUserResult,
  RESTPostOAuth2AccessTokenResult,
  Routes,
} from "discord-api-types/v10";
import { Hono } from "hono";
import { createToken } from "src/lib/auth";
import { HttpStatus } from "src/lib/http-status";

const auth = new Hono<{ Bindings: Env }>();

auth.get("/authorize", async function authorize(c) {
  const code = c.req.query("code");
  if (!code || code.length !== 30 || !code.match(/^[a-z0-9]+$/i))
    return c.text("Missing 'code'", HttpStatus.BAD_REQUEST);

  let accessToken:
    | RESTPostOAuth2AccessTokenResult
    | { error: string; error_description?: string };
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
            client_id: c.env.CLIENT_ID,
            client_secret: c.env.CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri:
              c.env.ENVIRONMENT === "production"
                ? c.env.REDIRECT_URI
                : c.env.LOCAL_REDIRECT_URI,
            scope: "identify",
          }),
        },
      )
    ).json();
  } catch (e) {
    return c.text(`Invalid OAuth2 code (${e})`, HttpStatus.BAD_REQUEST);
  }

  if (!("access_token" in accessToken))
    return c.text(
      `Invalid OAuth2 code response (${[accessToken.error, accessToken.error_description].filter((x) => x).join(", ")})`,
      HttpStatus.BAD_REQUEST,
    );

  const { id } = (await (
    await fetch(`https://discord.com/api/v10${Routes.user("@me")}`, {
      headers: {
        authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
    })
  ).json()) as RESTGetAPICurrentUserResult;

  return c.text(await createToken(id));
});

export default auth;

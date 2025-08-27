import {
	RESTGetAPICurrentUserResult,
	RESTPostOAuth2AccessTokenResult,
	RouteBases,
	Routes,
} from "discord-api-types/v10";
import { Hono } from "hono";
import { createToken } from "lib/auth";
import { HttpStatus } from "lib/http-status";
import { logger } from "lib/logger";

type APIAccessTokenResult = RESTPostOAuth2AccessTokenResult | {
	code?: number;
	message?: string;
	error?: string;
	error_description?: string;
};

const auth = new Hono<{ Bindings: Env }>();

auth.get("/authorize", async function authorize(c) {
	const code = c.req.query("code");
	if (!code || !/^[a-z0-9]{30}$/i.test(code)) {
		return c.text("Missing or invalid \"code\"", HttpStatus.BAD_REQUEST);
	}

	const url = new URL(c.req.url);

	const response = await fetch(
		RouteBases.api + Routes.oauth2TokenExchange(),
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
				redirect_uri: `${url.protocol}//${url.host}/api/auth/authorize`,
				scope: "identify",
			}),
		},
	);

	const text = await response.text();
	if (!response.ok && text.includes("error code: 1015")) {
		return c.text("Discord ratelimited, please try again later!", HttpStatus.TOO_MANY_REQUESTS);
	}

	let token: string;
	try {
		const accessToken = JSON.parse(text) as APIAccessTokenResult;
		if (!("access_token" in accessToken)) {
			return c.text(
				`Invalid OAuth2 code: [${accessToken.code ?? accessToken.error}] ${
					accessToken.message ?? accessToken.error_description
				}`,
				HttpStatus.BAD_REQUEST,
			);
		}

		token = `${accessToken.token_type} ${accessToken.access_token}`;
	} catch (error) {
		logger.error("Uncaught auth code response err", {
			response: text,
			error,
		});
		return c.text(`Invalid OAuth2 code response: ${text}`, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	const { id } = await (
		await fetch(RouteBases.api + Routes.user(), {
			headers: {
				Authorization: token,
			},
		})
	).json<RESTGetAPICurrentUserResult>();

	return c.text(await createToken(id));
});

export default auth;

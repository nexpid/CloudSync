import { initWasm, Resvg } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import avatar from "assets/profile/avatar.svg";
import banner from "assets/profile/banner.svg";
import {
	CDNRoutes,
	ImageFormat,
	RESTPatchAPICurrentUserResult,
	RESTPatchCurrentApplicationResult,
	RouteBases,
	Routes,
} from "discord-api-types/v10";
import { logger } from "lib/logger";

import { SillyService } from "./service";

const description = `Show off songs on your Discord profile!
« https://github.com/nexpid-labs/SongSpotlight »
« https://revenge.nexpid.xyz/song-spotlight »`;

export async function runSilly() {
	if (!process.env.CLIENT_TOKEN) {
		return logger.info("Silly not ran", { silly: { enabled: false } });
	}

	try {
		await initWasm(resvgWasm);
	} catch (error) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		console.error({ silly: { resvg: false, error } });
		return;
	}

	const colors = SillyService.getRandomColors();

	const avatarSvg = SillyService.toURL(
			new Resvg(
				avatar
					.replace(/#FF0000/g, colors.bg)
					.replace(/#FFFF00/g, colors.bgWhiter)
					.replace(/#00FF00/g, colors.cloud)
					.replace(/#0000FF/g, colors.cloudOutline),
				{
					fitTo: { mode: "width", value: 512 },
					font: { loadSystemFonts: false },
					shapeRendering: 2,
				},
			)
				.render()
				.asPng(),
		),
		bannerSvg = SillyService.toURL(
			new Resvg(
				banner
					.replace(/#FF0000/g, colors.bg)
					.replace(/#FFFF00/g, colors.bgWhiter)
					.replace(/#00FF00/g, colors.cloud)
					.replace(/#0000FF/g, colors.cloudOutline),
				{
					fitTo: { mode: "width", value: 680 },
					font: { loadSystemFonts: false },
					shapeRendering: 2,
				},
			)
				.render()
				.asPng(),
		);
	const fpte = SillyService.getFpte(colors.cloud, colors.bg);

	// "Bot " is included in the token
	const id = process.env.CLIENT_ID,
		token = process.env.CLIENT_TOKEN;
	const changedIconReq = await fetch(RouteBases.api + Routes.currentApplication(), {
		method: "PATCH",
		headers: {
			"content-type": "application/json",
			authorization: token,
		},
		body: JSON.stringify({
			icon: avatarSvg,
			description: description + fpte,
		}),
	});
	const changedIcon = await changedIconReq.json<RESTPatchCurrentApplicationResult>();

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
	const changedBanner = await changedBannerReq.json<RESTPatchAPICurrentUserResult>();

	if (!changedIcon?.id || !changedBanner?.id) {
		return logger.info("Silly service error", {
			silly: {
				logs: [changedIcon, changedBanner].filter((x) => !x.id),
				ratelimits: Object.fromEntries(
					(
						[
							["icon", [...changedIconReq.headers.entries()]],
							["banner", [...changedBannerReq.headers.entries()]],
						] as [string, [string, string][]][]
					).map(([key, values]) => [
						key,
						Object.fromEntries(
							values.filter(([header]) => header.toLowerCase().includes("x-rate")),
						),
					]),
				),
				success: false,
			},
		});
	} else {
		return logger.info("Silly service result", {
			silly: {
				colors,
				banner: RouteBases.cdn
					+ CDNRoutes.userBanner(id, changedBanner.banner, ImageFormat.PNG),
				avatar: RouteBases.cdn
					+ CDNRoutes.userAvatar(id, changedBanner.avatar, ImageFormat.PNG),
				icon: RouteBases.cdn
					+ CDNRoutes.applicationIcon(id, changedIcon.icon, ImageFormat.PNG),
				fpte,
				success: true,
			},
		});
	}
}

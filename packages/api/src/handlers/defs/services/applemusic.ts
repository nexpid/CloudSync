import { PLAYLIST_LIMIT, request } from "handlers/common";
import type { SongService } from "handlers/helpers";

import type { RenderInfoBase } from "../../types";
import { makeCache } from "../cache";

interface APIDataEntry {
	attributes: {
		url: string;
		name: string;
		artistName?: string;
		contentRating?: "explicit";
		durationInMillis?: number;
		previews?: {
			url: string;
		}[];
		artwork?: {
			url: string;
		};
	};
	relationships: {
		songs?: {
			data: APIDataEntry[];
		};
		tracks?: {
			data: APIDataEntry[];
		};
	};
}

interface APIData {
	data: [APIDataEntry];
}

// why not, right
const geo = "fr", defaultName = "songspotlight";

const applemusicToken = makeCache("applemusicToken", async (html?: string) => {
	html ??= (await request({
		url: `https://music.apple.com/${geo}/new`,
	})).text;

	const asset = html.match(/src="(\/assets\/index-\w+\.js)"/i)?.[1];
	if (!asset) return;

	const js = (await request({
		url: `https://music.apple.com${asset}`,
	})).text;

	const code = js.match(/\w+="(ey.*?)"/i)?.[1];
	return code;
});

export const applemusic: SongService = {
	name: "applemusic",
	hosts: [
		"music.apple.com",
		"geo.music.apple.com",
	],
	types: ["artist", "album", "playlist", "song"],
	async parse(_link, _host, path) {
		const [country, type, name, id, fourth] = path;
		if (!country || !type || !this.types.includes(type) || !name || !id || fourth) return null;

		const res = await request({
			url: `https://music.apple.com/${geo}/${type}/${defaultName}/${id}`,
		});
		if (res.status !== 200) return null;

		await applemusicToken.retrieve(res.text);

		return {
			service: this.name,
			type,
			id,
		};
	},
	async render(type, id) {
		const token = await applemusicToken.retrieve();
		if (!token) return null;

		const res = await request({
			url: `https://amp-api.music.apple.com/v1/catalog/${geo}/${type}s/${id}?include=songs`,
			headers: {
				authorization: `Bearer ${token}`,
				origin: "https://music.apple.com",
			},
		});
		if (res.status !== 200) return null;

		const { attributes, relationships } = (res.json as APIData).data[0];

		const base: RenderInfoBase = {
			label: attributes.name,
			sublabel: attributes.artistName ?? "Top Songs",
			explicit: attributes.contentRating === "explicit",
		};
		const thumbnailUrl = attributes.artwork?.url?.replace("{w}", "128")?.replace("{h}", "128");

		if (type === "song") {
			const duration = attributes.durationInMillis, previewUrl = attributes.previews?.[0]?.url;
			return {
				...base,
				form: "single",
				thumbnailUrl,
				single: {
					audio: previewUrl && duration
						? {
							previewUrl,
							duration,
						}
						: undefined,
					link: attributes.url,
				},
			};
		}

		const songs = (relationships.songs ?? relationships.tracks)?.data;
		if (!songs) return null;

		return {
			...base,
			form: "list",
			thumbnailUrl,
			list: songs.slice(0, PLAYLIST_LIMIT).map(({ attributes: song }) => {
				const duration = song.durationInMillis, previewUrl = song.previews?.[0]?.url;
				return {
					label: song.name,
					sublabel: song.artistName!,
					explicit: song.contentRating === "explicit",
					audio: previewUrl && duration
						? {
							previewUrl,
							duration,
						}
						: undefined,
					link: song.url,
				};
			}),
		};
	},
	from(type, id) {
		return `https://music.apple.com/us/${type}/${defaultName}/${id}`;
	},
};

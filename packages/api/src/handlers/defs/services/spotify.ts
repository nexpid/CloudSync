import { parseNextData, PLAYLIST_LIMIT, request } from "handlers/common";
import { type SongService } from "handlers/helpers";
import type { RenderInfoBase, RenderInfoEntryBased } from "handlers/types";

interface Next {
	props: {
		pageProps: {
			title?: string;
			state?: {
				data: {
					entity: {
						uri: string;
						title: string;
						subtitle: string;
						isExplicit: boolean;
						artists?: {
							name: string;
						}[];
						duration?: number;
						audioPreview?: {
							url: string;
						};
						trackList?: {
							uri: string;
							title: string;
							subtitle: string;
							isExplicit: boolean;
							artists?: {
								name: string;
							}[];
							duration?: number;
							audioPreview?: {
								url: string;
							};
						}[];
						visualIdentity: {
							image: {
								url: string;
								maxWidth: number;
							}[];
						};
					};
				};
			};
		};
	};
}

async function parseEmbed(type: string, id: string) {
	return parseNextData<Next>(
		(await request({
			url: `https://open.spotify.com/embed/${type}/${id}`,
		})).text,
	);
}

// TODO put this in the actual object, somehow
function from(type: string, id: string) {
	return `https://open.spotify.com/${type}/${id}`;
}
function fromUri(uri: string) {
	const [sanityCheck, type, id] = uri.split(":");
	if (sanityCheck === "spotify" && type && id) return from(type, id);
	else return null;
}

export const spotify: SongService = {
	name: "spotify",
	hosts: [
		"open.spotify.com",
	],
	types: ["track", "album", "playlist", "artist"],
	async parse(_link, _host, path) {
		const [type, id, third] = path;
		if (!type || !this.types.includes(type as never) || !id || third) return null;

		const title = (await parseEmbed(type, id))?.props?.pageProps?.title;
		if (title) return null;

		return {
			service: this.name,
			type,
			id,
		};
	},
	async render(type, id) {
		const data = (await parseEmbed(type, id) as Next)?.props?.pageProps?.state?.data?.entity;
		if (!data) return null;

		const base: RenderInfoBase = {
			label: data.title,
			sublabel: data.subtitle ?? data.artists?.map(x => x.name).join(", "),
			explicit: Boolean(data.isExplicit),
		};
		const thumbnailUrl = data.visualIdentity.image.sort((a, b) => a.maxWidth - b.maxWidth)[0]?.url;

		if (type === "track") {
			const link = fromUri(data.uri)!;

			return {
				...base,
				form: "single",
				thumbnailUrl,
				single: {
					audio: (data.audioPreview && data.duration)
						? {
							duration: data.duration,
							previewUrl: data.audioPreview.url,
						}
						: undefined,
					link,
				},
			};
		} else {
			const list: RenderInfoEntryBased[] = [];
			for (const track of (data.trackList ?? [])) {
				if (list.length >= PLAYLIST_LIMIT) continue;
				const link = fromUri(track.uri)!;

				list.push({
					label: track.title,
					sublabel: track.subtitle ?? track.artists?.map(x => x.name).join(", "),
					explicit: Boolean(track.isExplicit),
					audio: (track.audioPreview && track.duration)
						? {
							duration: track.duration,
							previewUrl: track.audioPreview.url,
						}
						: undefined,
					link,
				});
			}

			return {
				...base,
				form: "list",
				thumbnailUrl,
				list,
			};
		}
	},
	from,
};

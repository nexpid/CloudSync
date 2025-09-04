import { parseNextData, request } from "handlers/common";
import { parseLink } from "handlers/finders";
import { type SongParser } from "handlers/helpers";

interface Next {
	props: {
		pageProps: {
			pageData: {
				sections: {
					links: {
						platform: string;
						url: string;
					}[];
				}[];
			};
		};
	};
}

export const songdotlink: SongParser = {
	name: "song.link",
	hosts: [
		"song.link",
		"album.link",
		"artist.link",
		"pods.link",
		"playlist.link",
		"mylink.page",
		"odesli.co",
	],
	async parse(link, _host, path) {
		const [first, second, third] = path;
		if (!first || third) return null;

		if (second && Number.isNaN(+second)) return null;
		else if (
			!second && (!first.match(/^[A-z0-9-_]+$/) || first.match(/^[-_]/) || first.match(/[-_]$/))
		) return null;

		const html = (await request({
			url: link,
		})).text;

		const sections = parseNextData<Next>(html)?.props?.pageProps?.pageData?.sections;
		if (!sections) return null;

		const links = sections.flatMap(x => x.links ?? []).filter(x => x.url && x.platform);

		const valid = links.find(x => x.platform === "spotify")
			?? links.find(x => x.platform === "soundcloud")
			?? links.find(x => x.platform === "appleMusic");
		if (!valid) return null;

		return await parseLink(valid.url);
	},
};

import { AppleMusicSong, Song, SoundcloudSong, SpotifySong } from "lib/db";
import { HttpStatus } from "lib/http-status";

interface PartialSpotifyNextData {
	props: {
		pageProps: {
			state?: {
				data?: {
					entity?: unknown;
				};
			};
		};
	};
}

const validationCache = new Map<string, number | true>();

export const services = {
	async spotify({ type, id }: SpotifySong) {
		const res = await fetch(
			`https://open.spotify.com/embed/${type}/${id}`,
		).then((x) => x.text());

		try {
			const nextData = res
				.split("__NEXT_DATA__\" type=\"application/json\">")[1]
				.split("</script")[0];
			const data = JSON.parse(nextData) as PartialSpotifyNextData;

			return data.props.pageProps.state?.data?.entity
				? true
				: HttpStatus.BAD_REQUEST;
		} catch {
			return HttpStatus.INTERNAL_SERVER_ERROR;
		}
	},
	async soundcloud({ type, id }: SoundcloudSong) {
		const { status } = await fetch(
			`https://api-widget.soundcloud.com/${type}s/${id}?client_id=nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic&app_version=1732876988`,
		);

		return status === 200 ? true : HttpStatus.BAD_REQUEST;
	},
	async applemusic({ type, id }: AppleMusicSong) {
		const { status } = await fetch(
			`https://music.apple.com/us/${type}/songspotlight/${id}`,
		);

		return status === 200 ? true : HttpStatus.BAD_REQUEST;
	},
} satisfies Record<Song["service"], (song: Song) => Promise<number | true>>;

export async function validateSong(song: Song) {
	const hash = song.service + song.type + song.id;
	if (validationCache.has(hash)) return validationCache.get(hash);

	const res = await services[song.service](song as never);
	validationCache.set(hash, res);
	return res;
}

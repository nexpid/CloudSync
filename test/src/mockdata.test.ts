// Generates mock data for testing

import type { Song, UserData } from "../../src/lib/db";

const record = {
	spotify: ["track", "album", "playlist", "artist"],
	soundcloud: ["user", "track", "playlist"],
	applemusic: ["artist", "song", "album", "playlist"],
};

const mockData: UserData = Object.entries(record).flatMap(([service, x]) =>
	x.map(type =>
		({
			service,
			type,
			id: crypto.randomUUID(),
		}) as Song
	)
).sort(() => Math.random() > 0.5 ? -1 : 1);

console.log(JSON.stringify(mockData));

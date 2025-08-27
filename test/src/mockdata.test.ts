// Generates mock data for testing

const record = {
	spotify: ["track", "album", "playlist", "artist"],
	soundcloud: ["user", "track", "playlist"],
	applemusic: ["artist", "song", "album", "playlist"],
};

const mockData = Object.entries(record).map(([service, x]) =>
	x.map(type => ({
		service,
		type,
		id: crypto.randomUUID(),
	}))
).flat().sort(() => Math.random() > 0.5 ? -1 : 1);

console.log(JSON.stringify(mockData));

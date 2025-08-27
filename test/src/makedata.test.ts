// Generates example data for testing

// Mainly uses songs of/references to Kevin Macleod (KM) and Jane Remover (JR)
const spotify = {
	track: [
		"2UeMTAj1omK9Vh8UtiSyt9", // KM
		"4Y8zeYUPDn22jIsYJId8KI", // KM
		"2AjTT2CBthpsIQtyxzhSr4", // JR
		"75Wgg4LerPD3mVO5hEyUN9", // JR
	],
	album: [
		"3bC3ooOMFW7z14KKUkpsdm", // KM
		"1uJT1My0wIUMJw0awyrUog", // KM
		"21b4cDNse2AMpj94ykfuON", // JR
		"4ZtC6HhG26hK47TkNhrWT1", // JR
	],
	playlist: [
		"37i9dQZF1DZ06evO2uiXZQ", // KM
		"676LzNuSbxkw3oWhwhDkbh", // KM
		"37i9dQZF1DZ06evO1oQtnY", // JR
		"4gjVvxadXVSWV0lZNNfNfw", // JR
	],
	artist: [
		"4fSMtiyC6lF5BUO1tUMWMs", // KM
		"0gxyHStUsqpMadRV0Di1Qt",
		"2rLGlNI6htigNxx172qxLu", // JR
		"48wt14F9gzlkNDRdXyJTQz",
	],
};
const soundcloud = {
	user: [
		"1764285", // KM
		"207997261",
		"603043044", // JR
		"52019567",
	],
	track: [
		"1962051643", // KM
		"1962051607", // KM
		"2152314354", // JR
		"2051221096", // JR
	],
	playlist: [
		"287487354", // KM
		"276024169", // KM
		"1591842514", // JR
		"1948226087", // JR
	],
};

// TODO lf apple music songs im lazyyy aff :// :///// :\ :////
const applemusic = {
	artist: [],
	song: [],
	album: [],
	playlist: [],
};

export const mockData = [
	Object.entries(spotify).map(([type, x]) => x.map((id) => ({ service: "spotify", type, id }))),
	Object.entries(soundcloud).map(([type, x]) =>
		x.map((id) => ({ service: "soundcloud", type, id }))
	),
	Object.entries(applemusic).map(([type, x]) =>
		x.map((id) => ({ service: "applemusic", type, id }))
	),
].flat(2).sort(() => Math.random() > 0.5 ? -1 : 1);

console.log(JSON.stringify(mockData));

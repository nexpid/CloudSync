function hslToHex(h: number, s: number, l: number) {
	l /= 100;
	const a = (s * Math.min(l, 1 - l)) / 100;
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0"); // convert to Hex and prefix "0" if needed
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

function mixClr(a: number, b: number, mix: number) {
	return Math.floor(a * mix + b * (1 - mix));
}

export class SillyService {
	static getRandomColors() {
		const colors = {
			bg: "",
			bgWhiter: "",
			cloud: "",
			cloudOutline: "",
		};

		const baseH = Math.floor(Math.random() * 360);
		const baseS = Math.floor(Math.random() * 80 + 15);
		const baseL = Math.floor(Math.random() * 10 + 55);

		const outlineDiff = Math.floor(Math.random() * 5 + 20);

		colors.cloud = hslToHex(baseH, baseS, baseL);
		colors.cloudOutline = hslToHex(
			baseH,
			baseS,
			Math.min(
				baseL + (Math.random() <= 0.6 ? outlineDiff / 2 : -outlineDiff),
				100,
			),
		);

		const bgHDiff = Math.floor(Math.random() * 45 + 30);
		const bgH = Math.abs(baseH + (Math.random() <= 0.6 ? bgHDiff / 2 : -bgHDiff)) % 360;
		const bgS = Math.min(
			mixClr(Math.floor(Math.random() * 80 + 15), baseS, 0.9),
			100,
		);
		const bgL = Math.min(
			mixClr(Math.floor(Math.random() * 10 + 55), baseL, 0.9),
			100,
		);

		colors.bg = hslToHex(bgH, bgS, bgL);
		colors.bgWhiter = hslToHex(bgH, bgS, Math.min(bgL * 0.45, 100));

		return colors;
	}

	static toURL(buffer: Uint8Array) {
		return `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
	}

	// https://github.com/Equicord/Equicord/blob/85faac8c3f8b6beea2d2a61134b65ddffa872fd5/src/plugins/fakeProfileThemes/index.tsx#L43-L53
	static getFpte(primary: string, accent: string) {
		const message = `[${primary},${accent}]`;
		const padding = "";
		const encoded = Array.from(message)
			.map((x) => x.codePointAt(0))
			.filter((x) => x >= 0x20 && x <= 0x7f)
			.map((x) => String.fromCodePoint(x + 0xe0000))
			.join("");

		return `${padding || ""} ${encoded}`;
	}
}

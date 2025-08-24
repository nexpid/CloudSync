// Generates random mock data for testing

import type { UserData } from "../../src/lib/db";

const basePluginRoot = "https://bn-plugins.github.io/vd-proxy/user.github.io/plugins/";
const baseThemeRoot = "https://raw.githubusercontent.com/user/themes/main/";
const baseFontRoot = "https://raw.githubusercontent.com/user/fonts/main/";

const mockData: UserData = {
	plugins: Object.fromEntries(
		new Array(5).fill(0).map(() => [
			`${basePluginRoot}${crypto.randomUUID()}`,
			{
				enabled: Math.random() < 0.5,
				storage: JSON.stringify(
					Object.fromEntries(
						Object.entries({
							someValue: 0,
							thing: true,
							someOtherProperty: false,
							extremelyLongPropertyName: {
								enabled: true,
								bumpscosity: Math.random(),
							},
							yetAnotherProperty: [Math.random(), false, "Hi!"],
						}).filter(() => Math.random() < 0.5),
					),
				),
			},
		]),
	),
	themes: Object.fromEntries(
		new Array(5).fill(0).map(() => [
			`${baseThemeRoot}${crypto.randomUUID()}.json`,
			{
				enabled: Math.random() < 0.5,
			},
		]),
	),
	fonts: {
		installed: Object.fromEntries(
			new Array(5)
				.fill(0)
				.map(() => [
					`${baseFontRoot}${crypto.randomUUID()}.json`,
					{ enabled: Math.random() < 0.5 },
				]),
		),
		custom: new Array(2).fill(0).map(() => ({
			spec: 2,
			name: crypto.randomUUID(),
			previewText: new Array(Math.floor(Math.random() * 5) + 1)
				.fill(0)
				.map(() => crypto.randomUUID())
				.join(""),
			main: Object.fromEntries(
				new Array(12)
					.fill(0)
					.map(() => [
						crypto.randomUUID(),
						`${baseFontRoot}${crypto.randomUUID()}.ttf`,
					]),
			),
			enabled: Math.random() < 0.5,
		})),
	},
};

console.log(JSON.stringify(mockData));

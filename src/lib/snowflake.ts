const DISCORD_EPOCH = 1420070400000;

export function validate(id: string) {
	// validate snowflake based on https://github.com/vegeta897/snow-stamp/blob/8908d48bcee4883a7c4146bb17aa73b73a9009ba/src/convert.js
	if (!Number.isInteger(+id)) {
		return false;
	}

	const snowflake = BigInt(id) >> 22n;
	if (snowflake < 2592000000n) {
		return false;
	}

	const biggest = BigInt(Date.now() - DISCORD_EPOCH) << 22n;
	if (snowflake > biggest) {
		return false;
	}

	if (Number.isNaN(new Date(Number(snowflake) + DISCORD_EPOCH).getTime())) {
		return false;
	}

	return true;
}

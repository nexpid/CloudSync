import { services } from "handlers/core";
import type { core, ZodLiteral, ZodObject, ZodString } from "zod";
import z from "zod";

type SongDef = ZodObject<
	{
		service: ZodLiteral<string>;
		type: ZodLiteral<string>; // this is a ZodUnion, but casting it as that type lead to some issues with typescript
		id: ZodString;
	},
	core.$strip
>;

export const SongSchema = z.discriminatedUnion(
	"service",
	services.map((service) =>
		z.object({
			service: z.literal(service.name),
			type: z.union(service.types.map(type => z.literal(type))),
			id: z.string(),
		})
	) as unknown as [SongDef],
);

/** **UserDataSchema** does not have a limit by default */
export const UserDataSchema = z.array(SongSchema);

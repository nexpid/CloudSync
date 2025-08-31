import { services } from "handlers/core";
import type { core, ZodLiteral, ZodObject, ZodString, ZodUnion } from "zod";
import z from "zod";

type SongDef = ZodObject<
	{ service: ZodLiteral<string>; type: ZodUnion<ZodLiteral<string>[]>; id: ZodString },
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
	) as [SongDef],
);

export const UserDataSchema = z.array(SongSchema).max(6);

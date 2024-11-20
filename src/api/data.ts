import { decompressData } from "src/lib/db/conversion";
import {
  getUserData,
  retrieveUserData,
  saveUserData,
  deleteUserData,
  UserDataSchema,
} from "src/lib/db";
import { getUser } from "src/lib/auth";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { HttpStatus } from "src/lib/http-status";

const data = new Hono<{ Bindings: Env }>();

// getData
data.get("/", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

  try {
    const data = await getUserData(user.userId);

    c.header("Last-Modified", data?.at);
    return c.json(data?.data);
  } catch (e) {
    return c.text(e.toString(), HttpStatus.INTERNAL_SERVER_ERROR);
  }
});

// saveData
data.put(
  "/",
  validator("json", (value, c) => {
    const parsed = UserDataSchema.safeParse(value);
    if (parsed.error)
      return c.text(parsed.error.toString(), HttpStatus.BAD_REQUEST);

    return parsed.data;
  }),
  async (c) => {
    const data = c.req.valid("json");

    const user = await getUser(c.req.header("Authorization"));
    if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

    try {
      await saveUserData(user.userId, data, new Date().toUTCString());
      return c.json(true);
    } catch (e) {
      return c.text(e.toString(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  },
);

// deleteData
data.delete("/", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

  try {
    await deleteUserData(user.userId);
    return c.json(true);
  } catch (e) {
    return c.text(e.toString(), HttpStatus.INTERNAL_SERVER_ERROR);
  }
});

// downloadData
data.get("/raw", async (c) => {
  // Used as a bypass for iOs users, since RNFS is missing so the file can't be downloaded with code
  const user = await getUser(
    c.req.header("Authorization") ?? c.req.query("auth"),
  );
  if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

  try {
    const data = await retrieveUserData(user.userId);
    if (!data) return c.body(null, HttpStatus.NO_CONTENT);

    const hash = Buffer.from(
      await crypto.subtle.digest("SHA-1", new TextEncoder().encode(data.data)),
    )
      .toString("hex")
      .slice(0, 8);

    c.header("content-type", "text/plain");
    c.header(
      "content-disposition",
      `attachment; filename="CloudSync_${hash}.txt"`,
    );
    c.header("last-modified", data.at);
    return c.text(data.data);
  } catch (e) {
    return c.text(e.toString(), HttpStatus.INTERNAL_SERVER_ERROR);
  }
});

//decompressRawData
data.post("/decompress", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.text("Unauthorized", HttpStatus.UNAUTHORIZED);

  const rawData = await c.req.text();

  try {
    Buffer.from(rawData, "base64"); // make sure data is base64

    return c.json(await decompressData(rawData));
  } catch (e) {
    return c.text(e.toString(), HttpStatus.BAD_REQUEST);
  }
});

export default data;

import { randomBytes } from "node:crypto";

process.stdout.write(randomBytes(64).toString("hex"));

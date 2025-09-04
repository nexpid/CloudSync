import { compressData } from "../../src/lib/db/conversion";
import { mockData } from "./makedata.test";

console.log(JSON.stringify(mockData));
console.log();
console.log(await compressData(mockData));

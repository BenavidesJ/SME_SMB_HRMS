import { db_connection } from "../config/db.js";
import { seedUbicaciones } from "./seed-ubicaciones.js";

async function main() {
  await db_connection();
  await seedUbicaciones();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

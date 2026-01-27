import { db_connection } from "../config/db.js";
import { seed1AñoDatos } from "./seed-1a-datos-hist.js";
import { seedCatalogosBase } from "./seed-catalogos-base.js";
import { seedSuperAdmin } from "./seed-super-admin.js";
import { seedUbicaciones } from "./seed-ubicaciones.js";

async function main() {
  await db_connection();
  await seedUbicaciones();
  await seedCatalogosBase();
  await seedSuperAdmin();
  await seed1AñoDatos();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

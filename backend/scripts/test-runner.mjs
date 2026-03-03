import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const userArgs = process.argv.slice(2);
const isCoverageRun = userArgs.includes("--coverage");

const stripCoverageReportersArgs = (args) => {
  const clean = [];
  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];

    if (current === "--coverageReporters") {
      i += 1;
      continue;
    }

    if (current.startsWith("--coverageReporters=")) {
      continue;
    }

    clean.push(current);
  }
  return clean;
};

let jestArgs = [...userArgs];
if (isCoverageRun) {
  jestArgs = stripCoverageReportersArgs(jestArgs);
  jestArgs.push("--coverageReporters=json-summary");
}

const jestProcess = spawnSync(
  process.execPath,
  ["--experimental-vm-modules", "./node_modules/.bin/jest", ...jestArgs],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      TEST_COVERAGE_SILENT_CONSOLE: isCoverageRun ? "1" : "0",
    },
  }
);

const printModuleCoverageSummary = () => {
  const coverageFilePath = path.resolve("coverage/coverage-summary.json");
  if (!fs.existsSync(coverageFilePath)) {
    console.warn("No se encontró coverage/coverage-summary.json para generar resumen por módulo.");
    return;
  }

  const coverageSummary = JSON.parse(fs.readFileSync(coverageFilePath, "utf8"));
  const moduleTotals = new Map();

  for (const [filePath, metrics] of Object.entries(coverageSummary)) {
    if (filePath === "total") continue;

    const normalizedPath = filePath.replaceAll("\\", "/");
    const marker = "/src/modules/";
    const markerIndex = normalizedPath.indexOf(marker);
    if (markerIndex === -1) continue;

    const rest = normalizedPath.slice(markerIndex + marker.length);
    const moduleName = rest.split("/")[0];
    if (!moduleName) continue;

    const covered = metrics?.lines?.covered ?? 0;
    const total = metrics?.lines?.total ?? 0;

    const current = moduleTotals.get(moduleName) ?? { covered: 0, total: 0 };
    current.covered += covered;
    current.total += total;
    moduleTotals.set(moduleName, current);
  }

  const rows = [...moduleTotals.entries()]
    .map(([moduleName, totals]) => {
      const percentage = totals.total > 0 ? ((totals.covered / totals.total) * 100).toFixed(2) : "0.00";
      return { modulo: moduleName, coverage: `${percentage}%` };
    })
    .sort((a, b) => a.modulo.localeCompare(b.modulo));

  if (rows.length === 0) {
    console.log("No hay archivos bajo src/modules en este coverage run.");
    return;
  }

  console.log("\nResumen de coverage por módulo");
  console.table(rows);
};

if (isCoverageRun) {
  printModuleCoverageSummary();
}

if (typeof jestProcess.status === "number") {
  process.exit(jestProcess.status);
}

process.exit(1);

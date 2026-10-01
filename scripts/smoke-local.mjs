const base = (process.env.TERRA_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const checks = [
  { method: "GET", path: "/api/health", expected: 200 },
  { method: "GET", path: "/api/plants/list", expected: 200 },
  { method: "GET", path: "/api/community?limit=1", expected: 200 },
  { method: "GET", path: "/api/training", expected: 200 },
  { method: "GET", path: "/api/model?limit=1", expected: 200 },
  { method: "GET", path: "/api/catalogues", expected: 401 },
  { method: "GET", path: "/api/account/notifications", expected: 401 },
  { method: "POST", path: "/api/model", expected: 403, body: {} },
  { method: "POST", path: "/api/training", expected: 401, body: {} },
];
let failures = 0;
for (const check of checks) {
  try {
    const response = await fetch(`${base}${check.path}`, {
      method: check.method,
      headers: check.body ? { "Content-Type": "application/json" } : undefined,
      body: check.body ? JSON.stringify(check.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const passed = response.status === check.expected;
    console.log(`${passed ? "PASS" : "FAIL"} ${check.method} ${check.path}: ${response.status} (attendu ${check.expected})`);
    if (!passed) failures++;
  } catch (error) {
    console.error(`FAIL ${check.method} ${check.path}: ${error instanceof Error ? error.message : "erreur réseau"}`);
    failures++;
  }
}
if (failures) process.exit(1);
console.log(`${checks.length} contrôles de fumée réussis.`);

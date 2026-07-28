import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders The Nest login", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Nest · by Hotel Wren<\/title>/i);
  assert.match(html, /PRIVATE HOTEL PORTAL/);
  assert.match(html, /Welcome back\./);
  assert.match(html, /Wren Family/);
  assert.match(html, /Wren Guests/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the employee resources and procurement catalog", async () => {
  const [page, layout, catalog] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/data/product-catalog.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Resources/);
  assert.match(page, /Team/);
  assert.match(page, /Mews/);
  assert.match(page, /Diamo/);
  assert.match(page, /Toast/);
  assert.match(layout, /The Nest · by Hotel Wren/);
  assert.ok(JSON.parse(catalog).length > 400);

  await access(
    new URL(
      "../public/resources/hotel-wren-2026-employee-handbook-eb-signed.pdf",
      import.meta.url,
    ),
  );
});

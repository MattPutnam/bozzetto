/**
 * The stability promise, checked: the same kind, seed, size and options draw the same picture, with
 * the same alt text, in every release of a major version. A fingerprint of each kind's pictures is
 * kept in test/fixtures/fingerprints.json.
 *
 * - A new kind has no fingerprint yet: run `npm run fingerprints` to add it.
 * - A changed fingerprint means pictures people already have would change. Fix the accident, or, for
 *   a deliberate redraw, run `npm run fingerprints` and release it as a new major version.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { avatar, cat, categories, faces, hills, kinds, placeholders, render, type Kind } from "../src";

const FILE = new URL("./fixtures/fingerprints.json", import.meta.url);
const SIZES = ["400x300", "300x400", "960x240"] as const;
const SEEDS = [1, 2, 3, "stable"];

const digest = (parts: readonly string[]): string =>
  createHash("sha256").update(parts.join("\n")).digest("hex").slice(0, 16);

function kindPrint(kind: Kind): string {
  const parts: string[] = [];
  for (const size of SIZES)
    for (const seed of SEEDS) {
      const p = render(kind, { seed, size });
      parts.push(p.svg, p.alt, JSON.stringify(p.focus), JSON.stringify(p.options));
    }
  return digest(parts);
}

/** Everything else the promise covers: choosing kinds, avatars, palettes, textures and dark mode. */
function extras(): Record<string, string> {
  return {
    // Names, categories and faces are part of the promise too.
    categories: digest(Object.entries(categories).map(([name, list]) => `${name}: ${list.map(k => k.id).join(" ")}`)),
    faces: digest(faces.map(k => k.id)),
    "fixed options": digest([render(cat.with({ tabby: true }), { seed: 3 }).svg]),
    placeholders: digest(placeholders(48, { seed: 7 }).map(p => p.kind)),
    "placeholders random": digest(placeholders(48, { seed: 7, order: "random" }).map(p => p.kind)),
    avatars: digest(Array.from({ length: 48 }, (_, k) => avatar({ seed: `user-${k}` }).svg)),
    palettes: digest(
      ["pastel", "riso", "sea glass", "dim", ["#264653", "#e9c46a", "#e76f51"]].map(
        palette => render(hills, { seed: 3, palette }).svg,
      ),
    ),
    mappings: digest(
      (["balanced", "ramp", "nearest"] as const).map(
        mapping => render(hills, { seed: 3, palette: "riso", mapping }).svg,
      ),
    ),
    textures: digest((["grain", "paper"] as const).map(texture => render(cat, { seed: 3, texture }).svg)),
    dark: digest([render(cat, { seed: 3, dark: true }).svg, render(hills, { seed: 3, dark: "sea glass" }).svg]),
  };
}

function current(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const kind of kinds) out[`kind ${kind.id}`] = kindPrint(kind);
  return { ...out, ...extras() };
}

const now = current();

if (process.env.UPDATE_FINGERPRINTS) writeFileSync(FILE, JSON.stringify(now, null, 2) + "\n");

describe("stability", () => {
  const saved = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, string>;

  it("keeps every fingerprinted picture the same", () => {
    const changed = Object.keys(saved).filter(key => now[key] !== saved[key]);
    expect(changed, "These would draw differently for people who already use them").toEqual([]);
  });

  it("has a fingerprint for every kind", () => {
    const missing = Object.keys(now).filter(key => !(key in saved));
    expect(missing, "Run `npm run fingerprints` to add new kinds").toEqual([]);
  });
});

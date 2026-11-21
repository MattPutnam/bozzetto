/**
 * Kinds written as text, for the command line and HTML attributes: an id (`ice-cream`), an export
 * name (`iceCream`), a category (`animals`) or `all`, and options after a colon
 * (`cat:tabby,pupils=round`, where a bare option name means true).
 */
import { categories, kinds, type Kind, type OptionValue } from "./index";

const camel = (id: string) => id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

let byName: Map<string, readonly Kind[]> | undefined;

/** Every name a kind can be written as, lowercased: its id, its export name, a category, or "all". */
function names(): Map<string, readonly Kind[]> {
  if (byName) return byName;
  byName = new Map<string, readonly Kind[]>();
  for (const kind of kinds) {
    byName.set(kind.id.toLowerCase(), [kind]);
    byName.set(camel(kind.id).toLowerCase(), [kind]);
  }
  for (const [name, list] of Object.entries(categories)) byName.set(name.toLowerCase(), list);
  byName.set("all", kinds);
  return byName;
}

/** A kind with options from text such as "tabby,pupils=round". */
function withOptions(kind: Kind, text: string, token: string): Kind {
  const values: Record<string, OptionValue> = {};
  for (const part of text.split(",").filter(Boolean)) {
    const [option, raw = "true"] = part.split("=");
    const allowed = kind.options[option];
    if (!allowed) {
      const known = Object.keys(kind.options);
      throw new Error(
        `bozzetto: ${kind.id} has no option "${option}" in "${token}". ${known.length ? `Its options are ${known.join(", ")}.` : "It has no options."}`,
      );
    }
    const value = allowed.find(v => String(v) === raw);
    if (value === undefined)
      throw new Error(`bozzetto: ${kind.id}'s ${option} can be ${allowed.join(", ")}, not "${raw}".`);
    values[option] = value;
  }
  return kind.with(values);
}

/** The kinds one written name stands for: one kind, or a category's kinds. */
export function parseKind(token: string): readonly Kind[] {
  const [name, options] = token.trim().split(/:(.*)/s);
  const found = names().get(name.toLowerCase());
  if (!found) throw new Error(`bozzetto: unknown kind "${name}".`);
  if (options === undefined) return found;
  if (found.length !== 1) throw new Error(`bozzetto: options go on a single kind, not a category: "${token}".`);
  return [withOptions(found[0], options, token)];
}

/** The kinds a list of written names stands for, such as `["animals", "cat:tabby"]` or "animals donut". */
export function parseKinds(text: string | readonly string[]): Kind[] {
  const tokens = typeof text === "string" ? text.split(/\s+/).filter(Boolean) : text;
  return tokens.flatMap(token => parseKind(token));
}

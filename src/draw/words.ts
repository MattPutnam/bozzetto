/** Small helpers for writing alt text. */

const NUMBERS = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

/** A count in words up to twelve ("three"), then in digits ("15"). */
export const numberWord = (count: number): string => NUMBERS[count] ?? String(count);

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Joins the phrases that aren't empty or false as "a", "a and b" or "a, b and c". */
export function andList(parts: readonly (string | false | 0 | null | undefined)[]): string {
  const words = parts.filter((part): part is string => !!part);
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

/** Counts each name, most numerous first: "two bottles", "a jar", or just "apples" when `vague`. */
export function tally(names: readonly string[], plural: (name: string) => string, vague = false): string[] {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) =>
      count === 1 ? `a ${name}` : vague ? plural(name) : `${numberWord(count)} ${plural(name)}`,
    );
}

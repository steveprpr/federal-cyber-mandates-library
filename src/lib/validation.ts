import type { Mandate } from "./schema";

export const officialHosts = [
  "whitehouse.gov",
  "www.whitehouse.gov",
  "omb.gov",
  "www.omb.gov",
  "cisa.gov",
  "www.cisa.gov",
  "dhs.gov",
  "www.dhs.gov",
  "nist.gov",
  "www.nist.gov",
  "csrc.nist.gov",
  "federalregister.gov",
  "www.federalregister.gov",
  "doi.org",
];
export function isOfficialSource(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return officialHosts.includes(host) || host.endsWith(".gov");
  } catch {
    return false;
  }
}
const normalize = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
export function verifyZeroTrustExcerpts(
  item: Mandate,
  sourceText: string,
): string[] {
  const errors: string[] = [];
  if (item.zeroTrust && item.zeroTrustExcerpts.length === 0)
    errors.push("Zero Trust designation requires at least one excerpt.");
  for (const match of item.zeroTrustExcerpts) {
    if (!/zero[ -]?trust/i.test(match.excerpt))
      errors.push(
        `Excerpt at ${match.locator} does not explicitly name Zero Trust.`,
      );
    if (!normalize(sourceText).includes(normalize(match.excerpt)))
      errors.push(
        `Excerpt at ${match.locator} was not found in extracted source text.`,
      );
  }
  return errors;
}
export function findDuplicates(items: Mandate[]): string[] {
  const ids = new Map<string, string>();
  const errors: string[] = [];
  for (const item of items) {
    const key = item.identifier.toLocaleLowerCase();
    if (ids.has(key))
      errors.push(
        `Duplicate identifier ${item.identifier}: ${ids.get(key)} and ${item.id}.`,
      );
    else ids.set(key, item.id);
  }
  return errors;
}
export function validateRelationships(items: Mandate[]): string[] {
  const ids = new Set(items.map((x) => x.id));
  const errors: string[] = [];
  for (const item of items) {
    for (const id of item.supersedes)
      if (!ids.has(id))
        errors.push(
          `${item.identifier} references missing superseded document ${id}.`,
        );
    for (const id of item.supersededBy)
      if (!ids.has(id))
        errors.push(
          `${item.identifier} references missing superseding document ${id}.`,
        );
  }
  return errors;
}

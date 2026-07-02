export type DiscoveryAuthority = "OMB" | "CISA" | "NIST";
export type DiscoveredCandidate = {
  identifier: string;
  title: string;
  url: string;
  issuingAuthority: DiscoveryAuthority;
};

const relevantTitle =
  /cyber|zero[ -]?trust|post[ -]?quantum|cryptograph|vulnerab|logging|network visibility|api protection|secure (?:software|cloud|practices)|software supply|information secur|incident response|identity,? credential|multifactor|encryption|endpoint detection|critical infrastructure/i;
const identifierPatterns: Record<DiscoveryAuthority, RegExp> = {
  OMB: /\bM-\d{2}-\d{2}\b/i,
  CISA: /\b(?:BOD|ED)\s*\d{2}-\d{2}\b/i,
  NIST: /\b(?:SP|IR|CSWP|FIPS)\s*\d[\w.-]*(?:\s+Rev\.\s*\d+)?\b/i,
};

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function discoverCandidates(
  html: string,
  indexUrl: string,
  issuingAuthority: DiscoveryAuthority,
): DiscoveredCandidate[] {
  const candidates: DiscoveredCandidate[] = [];
  const seen = new Set<string>();
  let parseableLinks = 0;
  if (issuingAuthority === "NIST") {
    for (const row of html.matchAll(
      /<tr\b[^>]*id=["']result-([^"']+)["'][^>]*>([\s\S]*?)<\/tr>/gi,
    )) {
      const key = row[1] ?? "";
      const body = row[2] ?? "";
      const series = decode(
        body.match(
          new RegExp(
            `id=["']pub-series-${key}["'][^>]*>([\\s\\S]*?)<\\/td>`,
            "i",
          ),
        )?.[1] ?? "",
      );
      const number = decode(
        body.match(
          new RegExp(
            `id=["']pub-number-${key}["'][^>]*>([\\s\\S]*?)<\\/td>`,
            "i",
          ),
        )?.[1] ?? "",
      );
      const link = body.match(
        new RegExp(
          `<a\\b[^>]*href=["']([^"']+)["'][^>]*id=["']pub-title-link-${key}["'][^>]*>([\\s\\S]*?)<\\/a>`,
          "i",
        ),
      );
      if (!series || !number || !link) continue;
      parseableLinks += 1;
      const title = decode(link[2] ?? "");
      if (!relevantTitle.test(title)) continue;
      const identifier = `${series} ${number}`.toUpperCase();
      const url = new URL(decode(link[1] ?? ""), indexUrl).href;
      const candidateKey = `${identifier}|${url}`;
      if (!seen.has(candidateKey)) {
        seen.add(candidateKey);
        candidates.push({ identifier, title, url, issuingAuthority });
      }
    }
  }
  for (const match of html.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const href = decode(match[1] ?? "");
    const text = decode(match[2] ?? "");
    const combined = `${text} ${href}`;
    const identifier = combined
      .match(identifierPatterns[issuingAuthority])?.[0]
      ?.replace(/\s+/g, " ")
      .toUpperCase();
    if (!identifier) continue;
    parseableLinks += 1;
    const title = text
      .replace(identifierPatterns[issuingAuthority], "")
      .replace(/\s*\([A-Z][a-z]+ \d{1,2}, \d{4}\)\s*$/, "")
      .replace(/^\s*[:–-]\s*/, "")
      .trim();
    if (!relevantTitle.test(title)) continue;
    const url = new URL(href, indexUrl).href;
    const key = `${identifier}|${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push({ identifier, title, url, issuingAuthority });
    }
  }
  if (parseableLinks === 0)
    throw new Error(
      `Official ${issuingAuthority} index yielded no parseable document links: ${indexUrl}`,
    );
  return candidates;
}

export function findNewCandidates(
  candidates: DiscoveredCandidate[],
  current: Array<{ identifier: string; sourceUrls: string[] }>,
): DiscoveredCandidate[] {
  const identifiers = new Set(
    current.map((item) => item.identifier.toUpperCase()),
  );
  const urls = new Set(
    current.flatMap((item) => item.sourceUrls.map((url) => new URL(url).href)),
  );
  return candidates.filter(
    (candidate) =>
      !identifiers.has(candidate.identifier.toUpperCase()) &&
      !urls.has(new URL(candidate.url).href),
  );
}

export function selectCandidateBatch(
  candidates: DiscoveredCandidate[],
  maximum: number,
): DiscoveredCandidate[] {
  return candidates.slice(0, Math.max(0, maximum));
}

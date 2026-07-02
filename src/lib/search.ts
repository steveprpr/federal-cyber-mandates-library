import type { Mandate } from "./schema";

export type QueryState = {
  search?: string;
  authorities?: readonly string[];
  documentTypes?: readonly string[];
  years?: readonly string[];
  statuses?: readonly string[];
  authorityLevels?: readonly string[];
  topics?: readonly string[];
  organizations?: readonly string[];
  deadline?: "all" | "has-deadline" | "none";
  zeroTrust?: "all" | "yes" | "no";
  sort?: "publication-desc" | "publication-asc" | "title-asc" | "verified-desc";
};
const includes = (selected: readonly string[] | undefined, value: string) =>
  !selected?.length || selected.includes(value);
export function applyQuery(items: Mandate[], query: QueryState): Mandate[] {
  const needle = query.search?.trim().toLocaleLowerCase();
  return items
    .filter((item) => {
      const haystack = [
        item.title,
        item.identifier,
        item.summary,
        ...item.executiveHighlights,
        ...item.requirements,
        item.applicability,
        ...item.topics,
        ...item.affectedOrganizations,
        item.extractedText,
      ]
        .join(" ")
        .toLocaleLowerCase();
      return (
        (!needle || haystack.includes(needle)) &&
        includes(query.authorities, item.issuingAuthority) &&
        includes(query.documentTypes, item.documentType) &&
        includes(query.years, item.publicationDate.slice(0, 4)) &&
        includes(query.statuses, item.status) &&
        includes(query.authorityLevels, item.authorityLevel) &&
        (!query.topics?.length ||
          query.topics.some((v) => item.topics.includes(v))) &&
        (!query.organizations?.length ||
          query.organizations.some((v) =>
            item.affectedOrganizations.includes(v),
          )) &&
        (query.deadline !== "has-deadline" || item.deadlines.length > 0) &&
        (query.deadline !== "none" || item.deadlines.length === 0) &&
        (query.zeroTrust !== "yes" || item.zeroTrust) &&
        (query.zeroTrust !== "no" || !item.zeroTrust)
      );
    })
    .toSorted((a, b) =>
      query.sort === "title-asc"
        ? a.title.localeCompare(b.title)
        : query.sort === "publication-asc"
          ? a.publicationDate.localeCompare(b.publicationDate)
          : query.sort === "verified-desc"
            ? b.verifiedAt.localeCompare(a.verifiedAt)
            : b.publicationDate.localeCompare(a.publicationDate),
    );
}
export function encodeQuery(query: QueryState): string {
  const p = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => p.append(key, v));
    else if (value && value !== "all" && value !== "publication-desc")
      p.set(key, String(value));
  });
  return p.toString();
}
export function decodeQuery(value: string): QueryState {
  const p = new URLSearchParams(value);
  const multi = (key: string) => p.getAll(key);
  return {
    search: p.get("search") || undefined,
    authorities: multi("authorities"),
    documentTypes: multi("documentTypes"),
    years: multi("years"),
    statuses: multi("statuses"),
    authorityLevels: multi("authorityLevels"),
    topics: multi("topics"),
    organizations: multi("organizations"),
    deadline: (p.get("deadline") as QueryState["deadline"]) || "all",
    zeroTrust: (p.get("zeroTrust") as QueryState["zeroTrust"]) || "all",
    sort: (p.get("sort") as QueryState["sort"]) || "publication-desc",
  };
}

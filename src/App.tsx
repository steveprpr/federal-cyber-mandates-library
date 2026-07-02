import { useMemo, useState } from "react";
import { ExternalLink, Filter, Search, ShieldCheck, X } from "lucide-react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import rawMandates from "./data/mandates.json";
import { mandateCollectionSchema, type Mandate } from "./lib/schema";
import {
  applyQuery,
  decodeQuery,
  encodeQuery,
  type QueryState,
} from "./lib/search";

const mandates = mandateCollectionSchema.parse(rawMandates);
const labels: Record<string, string> = {
  "binding-requirement": "Binding requirement",
  "implementation-directive": "Implementation directive",
  "authoritative-guidance": "Authoritative guidance",
  "supporting-reference": "Supporting reference",
};
const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        Federal Cyber Mandates Library
      </Link>
      <nav aria-label="Primary">
        <NavLink to="/">Research Library</NavLink>
        <NavLink to="/methodology">Methodology</NavLink>
      </nav>
    </header>
  );
}
function Badge({ item }: { item: Mandate }) {
  return (
    <div className="badges">
      <span className={`authority ${item.authorityLevel}`}>
        {labels[item.authorityLevel]}
      </span>
      <span className={`status ${item.status}`}>{item.status}</span>
      {item.zeroTrust ? (
        <span className="zero-badge">
          <ShieldCheck size={15} aria-hidden="true" /> ZERO TRUST
        </span>
      ) : null}
    </div>
  );
}
const unique = (key: (m: Mandate) => string[]) =>
  [...new Set(mandates.flatMap(key))].sort();
const authorities = unique((m) => [m.issuingAuthority]),
  types = unique((m) => [m.documentType]),
  topics = unique((m) => m.topics),
  organizations = unique((m) => m.affectedOrganizations),
  years = unique((m) => [m.publicationDate.slice(0, 4)]).reverse();
function FilterGroup({
  title,
  name,
  options,
  selected,
  onToggle,
}: {
  title: string;
  name: keyof QueryState;
  options: string[];
  selected: readonly string[];
  onToggle: (n: keyof QueryState, v: string) => void;
}) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {options.map((option) => (
        <label className="check" key={option}>
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onToggle(name, option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </fieldset>
  );
}
function Library() {
  const [params, setParams] = useSearchParams();
  const initial = decodeQuery(params.toString());
  const [query, setQuery] = useState<QueryState>(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const update = (next: QueryState) => {
    setQuery(next);
    setParams(encodeQuery(next), { replace: true });
  };
  const toggle = (key: keyof QueryState, value: string) => {
    const current = (query[key] as readonly string[] | undefined) ?? [];
    update({
      ...query,
      [key]: current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value],
    });
  };
  const results = useMemo(() => applyQuery(mandates, query), [query]);
  return (
    <main id="main">
      <section className="intro">
        <div>
          <h1>Federal Cyber Mandates Library</h1>
          <p>
            Independent research aid for federal cybersecurity requirements and
            authoritative guidance.
          </p>
        </div>
        <p className="updated">
          Last updated <strong>July 2, 2026</strong>
        </p>
      </section>
      <div className="search-row">
        <Search aria-hidden="true" />
        <input
          aria-label="Search mandates"
          type="search"
          placeholder="Search titles, requirements, topics, and source text"
          value={query.search ?? ""}
          onChange={(e) => update({ ...query, search: e.target.value })}
        />
        <button
          className="filter-toggle"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Filter size={17} /> Filters
        </button>
        <select
          aria-label="Sort results"
          value={query.sort ?? "publication-desc"}
          onChange={(e) =>
            update({ ...query, sort: e.target.value as QueryState["sort"] })
          }
        >
          <option value="publication-desc">Newest publication</option>
          <option value="publication-asc">Oldest publication</option>
          <option value="title-asc">Title A–Z</option>
          <option value="verified-desc">Last verified</option>
        </select>
      </div>
      <div className="library-layout">
        <aside
          className={filtersOpen ? "filters open" : "filters"}
          aria-label="Research filters"
        >
          <button
            className="close-filters"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          >
            <X />
          </button>
          <div className="filter-heading">
            <h2>Filters</h2>
            <button onClick={() => update({})}>Clear all</button>
          </div>
          <label className="zero-filter">
            <input
              type="checkbox"
              aria-label="Zero Trust only"
              checked={query.zeroTrust === "yes"}
              onChange={(e) =>
                update({
                  ...query,
                  zeroTrust: e.target.checked ? "yes" : "all",
                })
              }
            />
            <ShieldCheck aria-hidden="true" />{" "}
            <span>
              ZERO TRUST only{" "}
              <strong>{mandates.filter((m) => m.zeroTrust).length}</strong>
            </span>
          </label>
          <FilterGroup
            title="Issuing authority"
            name="authorities"
            options={authorities}
            selected={query.authorities ?? []}
            onToggle={toggle}
          />
          <FilterGroup
            title="Document type"
            name="documentTypes"
            options={types}
            selected={query.documentTypes ?? []}
            onToggle={toggle}
          />
          <FilterGroup
            title="Publication year"
            name="years"
            options={years}
            selected={query.years ?? []}
            onToggle={toggle}
          />
          <FilterGroup
            title="Status"
            name="statuses"
            options={["active", "superseded", "rescinded", "archived"]}
            selected={query.statuses ?? []}
            onToggle={toggle}
          />
          <FilterGroup
            title="Authority level"
            name="authorityLevels"
            options={Object.keys(labels)}
            selected={query.authorityLevels ?? []}
            onToggle={toggle}
          />
          <FilterGroup
            title="Cybersecurity topic"
            name="topics"
            options={topics}
            selected={query.topics ?? []}
            onToggle={toggle}
          />
          <FilterGroup
            title="Affected organizations"
            name="organizations"
            options={organizations}
            selected={query.organizations ?? []}
            onToggle={toggle}
          />
          <fieldset>
            <legend>Deadline</legend>
            <select
              aria-label="Deadline filter"
              value={query.deadline ?? "all"}
              onChange={(e) =>
                update({
                  ...query,
                  deadline: e.target.value as QueryState["deadline"],
                })
              }
            >
              <option value="all">Any deadline</option>
              <option value="has-deadline">Has deadline</option>
              <option value="none">No listed deadline</option>
            </select>
          </fieldset>
        </aside>
        <section className="results" aria-live="polite">
          <div className="results-head">
            <h2>
              {results.length} {results.length === 1 ? "result" : "results"}
            </h2>
            <span>
              {query.search
                ? `for “${query.search}”`
                : "across the verified collection"}
            </span>
          </div>
          {results.length === 0 ? (
            <div className="empty">
              <h3>No mandates match</h3>
              <p>Try removing a filter or using a broader search term.</p>
            </div>
          ) : (
            <div className="result-list">
              {results.map((item) => (
                <article
                  className={
                    item.zeroTrust ? "result-card zero-result" : "result-card"
                  }
                  key={item.id}
                >
                  <div className="result-main">
                    <p className="meta">
                      {item.issuingAuthority} · {item.documentType} ·{" "}
                      {formatDate(item.publicationDate)}
                    </p>
                    <h3>
                      <Link
                        to={`/mandates/${item.slug}${params.toString() ? `?${params}` : ""}`}
                      >
                        {item.title}
                      </Link>
                    </h3>
                    <p className="identifier">{item.identifier}</p>
                    <p>{item.summary}</p>
                    <Badge item={item} />
                  </div>
                  <div className="verified">
                    Verified
                    <br />
                    <strong>{formatDate(item.verifiedAt)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
function Detail() {
  const { slug } = useParams();
  const item = mandates.find((m) => m.slug === slug);
  const location = useLocation();
  if (!item)
    return (
      <main id="main" className="prose">
        <h1>Record not found</h1>
        <Link to="/">Return to library</Link>
      </main>
    );
  const related = mandates.filter(
    (m) =>
      item.relatedDocuments.includes(m.id) ||
      item.supersedes.includes(m.id) ||
      item.supersededBy.includes(m.id),
  );
  return (
    <main id="main" className="detail">
      <Link className="back" to={`/${location.search}`}>
        ← Back to research results
      </Link>
      <p className="meta">
        {item.issuingAuthority} · {item.documentType} · Published{" "}
        {formatDate(item.publicationDate)}
      </p>
      <h1>{item.title}</h1>
      <p className="detail-id">{item.identifier}</p>
      <Badge item={item} />
      <section className="highlights">
        <h2>Executive highlights</h2>
        <ul>
          {item.executiveHighlights.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      <div className="detail-grid">
        <div>
          <section>
            <h2>Key requirements</h2>
            {item.requirements.length ? (
              <ul>
                {item.requirements.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <p>
                This guidance does not itself impose universal requirements;
                check incorporated policy and contract terms.
              </p>
            )}
          </section>
          <section>
            <h2>Deadlines and milestones</h2>
            {item.deadlines.length ? (
              <ul>
                {item.deadlines.map((x) => (
                  <li key={x.label}>
                    <strong>{x.date ? formatDate(x.date) : "Ongoing"}:</strong>{" "}
                    {x.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No discrete deadline is recorded in this library entry.</p>
            )}
          </section>
          <section>
            <h2>Applicability and affected organizations</h2>
            <p>{item.applicability}</p>
            <p>{item.affectedOrganizations.join(" · ")}</p>
          </section>
          <section>
            <h2>Practical implementation implications</h2>
            <p>
              {item.summary} Implementation teams should trace each action to
              the official source, current amendments, and agency-specific
              direction.
            </p>
          </section>
          {item.zeroTrust ? (
            <section className="zero-section">
              <h2>
                <ShieldCheck /> Source-grounded Zero Trust excerpts
              </h2>
              {item.zeroTrustExcerpts.map((x) => (
                <blockquote key={x.locator}>
                  “{x.excerpt}”<cite>{x.locator}</cite>
                </blockquote>
              ))}
            </section>
          ) : null}
        </div>
        <aside className="record-facts">
          <h2>Record facts</h2>
          <dl>
            <dt>Status</dt>
            <dd>{item.status}</dd>
            <dt>Authority classification</dt>
            <dd>{labels[item.authorityLevel]}</dd>
            <dt>Last verification</dt>
            <dd>{formatDate(item.verifiedAt)}</dd>
            <dt>Topics</dt>
            <dd>{item.topics.join(", ")}</dd>
          </dl>
          <h2>Official sources</h2>
          {item.sourceUrls.map((url) => (
            <a
              className="source-link"
              href={url}
              target="_blank"
              rel="noreferrer"
              key={url}
            >
              Authoritative source <ExternalLink size={15} />
            </a>
          ))}
          <h2>Related mandates and guidance</h2>
          {related.length ? (
            related.map((x) => (
              <Link className="related" to={`/mandates/${x.slug}`} key={x.id}>
                {x.identifier}: {x.title}
              </Link>
            ))
          ) : (
            <p>No related records are currently indexed.</p>
          )}
        </aside>
      </div>
      <section>
        <h2>Change history</h2>
        <ul>
          {item.changeHistory.map((x) => (
            <li key={x.date + x.description}>
              <strong>{formatDate(x.date)}</strong> — {x.description}
            </li>
          ))}
        </ul>
      </section>
      <div className="notice">
        <strong>Verification notice.</strong> This independent research aid is
        not an official government system. Always verify requirements against
        the authoritative source and current agency instructions.
      </div>
    </main>
  );
}
function Methodology() {
  return (
    <main id="main" className="prose">
      <h1>Methodology</h1>
      <p>
        This library favors accuracy and traceability over record count. Records
        are selected from official federal sources, classified according to the
        issuing instrument, and checked for status and relationships.
      </p>
      <h2>Authority classification</h2>
      <p>
        <strong>Binding requirement</strong> is reserved for instruments such as
        executive orders and CISA binding operational directives within their
        stated scope. <strong>Implementation directive</strong> describes
        operational OMB direction. <strong>Authoritative guidance</strong>{" "}
        includes NIST and CISA guidance that may become mandatory only when
        incorporated elsewhere. <strong>Supporting reference</strong> provides
        context.
      </p>
      <h2>Zero Trust rule</h2>
      <p>
        The amber designation is applied only when an authoritative source
        explicitly contains “Zero Trust” or a verified typographic variant.
        Every displayed excerpt must exist in extracted source text and include
        a source locator.
      </p>
      <h2>Limitations</h2>
      <p>
        Status and applicability can change. The visible verification date
        describes the last review of this local record, not a legal opinion or
        continuous monitoring guarantee.
      </p>
    </main>
  );
}
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/mandates/:slug" element={<Detail />} />
        <Route path="/methodology" element={<Methodology />} />
      </Routes>
      <footer>
        <p>Independent research aid · Not an official government system</p>
        <Link to="/methodology">Source and classification methodology</Link>
      </footer>
    </>
  );
}

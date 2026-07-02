import { describe, expect, it } from "vitest";
import { discoverCandidates, findNewCandidates } from "./discovery";

const ombIndex = `
  <a href="/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf">
    M-26-15 Execution of the Migration to Post-Quantum Cryptography (June 24, 2026)
  </a>
  <a href="/wp-content/uploads/2026/04/M-26-13-Reopening-the-Department-of-Homeland-Security.pdf">
    M-26-13 Reopening the Department of Homeland Security (April 30, 2026)
  </a>`;

describe("official index discovery", () => {
  it("discovers cybersecurity memoranda and excludes unrelated entries", () => {
    expect(
      discoverCandidates(
        ombIndex,
        "https://www.whitehouse.gov/omb/information-resources/guidance/memoranda/",
        "OMB",
      ),
    ).toEqual([
      expect.objectContaining({
        identifier: "M-26-15",
        title: "Execution of the Migration to Post-Quantum Cryptography",
        url: "https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf",
      }),
    ]);
  });

  it("compares identifiers and canonical URLs to find genuinely new documents", () => {
    const candidates = discoverCandidates(
      ombIndex,
      "https://www.whitehouse.gov/omb/information-resources/guidance/memoranda/",
      "OMB",
    );
    expect(
      findNewCandidates(candidates, [
        {
          identifier: "M-26-14",
          sourceUrls: ["https://example.gov/M-26-14.pdf"],
        },
      ]),
    ).toHaveLength(1);
    expect(
      findNewCandidates(candidates, [
        { identifier: "M-26-15", sourceUrls: [candidates[0]!.url] },
      ]),
    ).toHaveLength(0);
  });

  it("fails closed when a maintained index yields no parseable document links", () => {
    expect(() =>
      discoverCandidates(
        "<html>redesigned page</html>",
        "https://www.whitehouse.gov/",
        "OMB",
      ),
    ).toThrow(/no parseable document links/i);
  });

  it("joins NIST series and number cells with publication-title links", () => {
    const nistRow = `<tr id="result-26">
      <td id="pub-series-26">SP</td><td id="pub-number-26">800-228</td>
      <td><a href="/pubs/sp/800/228/upd1/final" id="pub-title-link-26">Guidelines for API Protection for Cloud-Native Systems</a></td>
    </tr>`;
    expect(
      discoverCandidates(
        nistRow,
        "https://csrc.nist.gov/publications/final-pubs",
        "NIST",
      ),
    ).toEqual([
      expect.objectContaining({
        identifier: "SP 800-228",
        title: "Guidelines for API Protection for Cloud-Native Systems",
      }),
    ]);
  });
});

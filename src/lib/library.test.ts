import { describe, expect, it } from "vitest";
import { mandateSchema } from "./schema";
import { applyQuery, decodeQuery, encodeQuery } from "./search";
import {
  findDuplicates,
  validateRelationships,
  verifyZeroTrustExcerpts,
} from "./validation";
import { sampleMandates } from "../test/fixtures";

describe("mandate schema", () => {
  it("accepts a complete mandate and rejects a Zero Trust record without excerpts", () => {
    expect(mandateSchema.parse(sampleMandates[0]).slug).toBe("m-22-09");
    expect(() =>
      mandateSchema.parse({ ...sampleMandates[0], zeroTrustExcerpts: [] }),
    ).toThrow();
  });
});

describe("research queries", () => {
  it("searches full text and applies every filter in combination", () => {
    const result = applyQuery(sampleMandates, {
      search: "phishing-resistant",
      authorities: ["OMB"],
      documentTypes: ["Memorandum"],
      years: ["2022"],
      statuses: ["active"],
      authorityLevels: ["implementation-directive"],
      topics: ["Identity and access management"],
      organizations: ["Federal civilian executive branch agencies"],
      deadline: "has-deadline",
      zeroTrust: "yes",
      sort: "publication-desc",
    });
    expect(result.map((item) => item.identifier)).toEqual(["M-22-09"]);
  });

  it("round-trips query state through a shareable URL", () => {
    const query = {
      search: "zero trust",
      authorities: ["OMB"],
      statuses: ["active"],
      sort: "title-asc",
    } as const;
    expect(decodeQuery(encodeQuery(query))).toMatchObject(query);
  });
});

describe("data integrity", () => {
  it("verifies exact normalized excerpts and rejects inferred Zero Trust", () => {
    expect(
      verifyZeroTrustExcerpts(
        sampleMandates[0]!,
        sampleMandates[0]!.extractedText,
      ),
    ).toEqual([]);
    expect(
      verifyZeroTrustExcerpts(
        { ...sampleMandates[1]!, zeroTrust: true },
        sampleMandates[1]!.extractedText,
      ),
    ).toContain("Zero Trust designation requires at least one excerpt.");
  });

  it("detects duplicate identifiers and broken supersession links", () => {
    expect(
      findDuplicates([
        ...sampleMandates,
        { ...sampleMandates[1]!, id: "copy" },
      ]),
    ).toHaveLength(1);
    expect(
      validateRelationships([
        { ...sampleMandates[0]!, supersededBy: ["missing"] },
        sampleMandates[1]!,
      ]),
    ).toContain("M-22-09 references missing superseding document missing.");
  });
});

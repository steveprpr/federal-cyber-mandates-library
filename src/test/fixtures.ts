import type { Mandate } from "../lib/schema";

const common = {
  effectiveDate: null,
  deadlines: [
    {
      date: "2024-09-30",
      label: "Target milestone",
      status: "historical" as const,
    },
  ],
  relatedDocuments: [],
  supersedes: [],
  supersededBy: [],
  sourceLocators: [],
  changeHistory: [
    { date: "2026-07-02", description: "Seeded from official source." },
  ],
};
export const sampleMandates: Mandate[] = [
  {
    ...common,
    id: "omb-m-22-09",
    slug: "m-22-09",
    title:
      "Moving the U.S. Government Toward Zero Trust Cybersecurity Principles",
    identifier: "M-22-09",
    issuingAuthority: "OMB",
    documentType: "Memorandum",
    authorityLevel: "implementation-directive",
    publicationDate: "2022-01-26",
    status: "active",
    summary: "Federal Zero Trust strategy.",
    executiveHighlights: ["Requires specific goals."],
    requirements: ["Use phishing-resistant MFA."],
    applicability: "Federal civilian executive branch agencies.",
    affectedOrganizations: ["Federal civilian executive branch agencies"],
    topics: ["Zero Trust", "Identity and access management"],
    zeroTrust: true,
    zeroTrustExcerpts: [
      {
        excerpt:
          "This memorandum requires agencies to achieve specific zero trust security goals by the end of Fiscal Year (FY) 2024.",
        locator: "Page 4",
      },
    ],
    sourceUrls: [
      "https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf",
    ],
    verifiedAt: "2026-07-02",
    contentHash: "a".repeat(64),
    extractedText:
      "This memorandum requires agencies to achieve specific zero trust security goals by the end of Fiscal Year (FY) 2024.",
  },
  {
    ...common,
    id: "nist-sp-800-53r5",
    slug: "nist-sp-800-53-rev-5",
    title:
      "Security and Privacy Controls for Information Systems and Organizations",
    identifier: "SP 800-53 Rev. 5",
    issuingAuthority: "NIST",
    documentType: "Special Publication",
    authorityLevel: "authoritative-guidance",
    publicationDate: "2020-09-23",
    status: "active",
    summary: "Control catalog.",
    executiveHighlights: ["Provides a control catalog."],
    requirements: [],
    applicability: "Organizations managing information systems.",
    affectedOrganizations: ["Federal agencies", "Other organizations"],
    topics: ["Federal information security"],
    zeroTrust: false,
    zeroTrustExcerpts: [],
    sourceUrls: ["https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"],
    verifiedAt: "2026-07-02",
    contentHash: "b".repeat(64),
    extractedText: "Security and privacy controls.",
  },
];

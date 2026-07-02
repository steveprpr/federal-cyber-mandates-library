import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const authorityLevels = [
  "binding-requirement",
  "implementation-directive",
  "authoritative-guidance",
  "supporting-reference",
] as const;
export const statuses = [
  "active",
  "superseded",
  "rescinded",
  "archived",
] as const;
export const mandateSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(3),
    identifier: z.string().min(1),
    issuingAuthority: z.string().min(1),
    documentType: z.string().min(1),
    authorityLevel: z.enum(authorityLevels),
    publicationDate: isoDate,
    effectiveDate: isoDate.nullable(),
    status: z.enum(statuses),
    summary: z.string().min(10),
    executiveHighlights: z.array(z.string()).min(1),
    requirements: z.array(z.string()),
    deadlines: z.array(
      z.object({
        date: isoDate.nullable(),
        label: z.string(),
        status: z.enum(["upcoming", "completed", "ongoing", "historical"]),
      }),
    ),
    applicability: z.string().min(3),
    affectedOrganizations: z.array(z.string()).min(1),
    topics: z.array(z.string()).min(1),
    zeroTrust: z.boolean(),
    zeroTrustExcerpts: z.array(
      z.object({ excerpt: z.string().min(5), locator: z.string().min(1) }),
    ),
    sourceUrls: z.array(z.string().url()).min(1),
    sourceLocators: z.array(z.string()),
    relatedDocuments: z.array(z.string()),
    supersedes: z.array(z.string()),
    supersededBy: z.array(z.string()),
    verifiedAt: isoDate,
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    extractedText: z.string().min(3),
    changeHistory: z
      .array(z.object({ date: isoDate, description: z.string().min(3) }))
      .min(1),
  })
  .superRefine((value, ctx) => {
    if (value.zeroTrust && value.zeroTrustExcerpts.length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["zeroTrustExcerpts"],
        message: "Zero Trust records require source-grounded excerpts.",
      });
    if (!value.zeroTrust && value.zeroTrustExcerpts.length > 0)
      ctx.addIssue({
        code: "custom",
        path: ["zeroTrustExcerpts"],
        message: "Non-Zero Trust records cannot include Zero Trust excerpts.",
      });
  });
export const mandateCollectionSchema = z.array(mandateSchema);
export type Mandate = z.infer<typeof mandateSchema>;
export type AuthorityLevel = Mandate["authorityLevel"];
export type MandateStatus = Mandate["status"];

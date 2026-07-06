export type VerificationRequest = {
  sourceId: string;
  siteUrl: string;
  evidenceUrls: string[];
  pageText: string;
};

export type VerificationVerdict = "approve" | "reject" | "needs_review";

export type VerificationResult = {
  verdict: VerificationVerdict;
  confidence: number;
  reason: string;
  extractableFields: string[];
  samplePreview: unknown;
  evidenceUrls: string[];
};

export interface VerificationAgent {
  readonly name: string;
  judge(request: VerificationRequest): Promise<VerificationResult>;
}

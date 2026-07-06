import { NotImplementedError } from "@/lib/errors";
import type {
  VerificationAgent,
  VerificationRequest,
  VerificationResult
} from "@/lib/providers/verification-agent";

export class OpenAIVerificationAgent implements VerificationAgent {
  readonly name = "OpenAI";

  async judge(request: VerificationRequest): Promise<VerificationResult> {
    void request;
    throw new NotImplementedError(
      "OpenAI verification is intentionally stubbed during Phase 0."
    );
  }
}

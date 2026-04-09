import test from "node:test";
import assert from "node:assert/strict";

import { classifyMaturity } from "@/lib/pipeline/maturity-classification-service";

test("classifyMaturity matches the requested thresholds", () => {
  assert.equal(classifyMaturity(0), "NON_AGENTIC");
  assert.equal(classifyMaturity(0.35), "PARTIAL");
  assert.equal(classifyMaturity(0.79), "PARTIAL");
  assert.equal(classifyMaturity(0.8), "AGENTIC");
  assert.equal(classifyMaturity(1), "AGENTIC");
});

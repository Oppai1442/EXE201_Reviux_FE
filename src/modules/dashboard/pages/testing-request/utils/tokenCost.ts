const BASIC_ALIASES = new Set([
  "basic_test",
  "functional_testing",
  "regression_testing",
  "usability_testing",
  "compatibility_testing",
  "ui_testing",
  "ui_ux_testing",
  "ux_testing",
]);

const INTEGRATION_ALIASES = new Set([
  "integration_test",
  "integration_testing",
  "api_testing",
  "system_integration_testing",
]);

const LOAD_ALIASES = new Set([
  "load_test",
  "load_testing",
  "performance_testing",
  "stress_testing",
  "security_testing",
]);

const AI_ALIASES = new Set([
  "ai_analysis",
  "ai_analysis_testing",
  "ai_testing",
  "ai_assisted_testing",
]);

const TOKEN_COST_BY_KEY: Record<string, number> = {
  basic_test: 1,
  integration_test: 3,
  load_test: 5,
  ai_analysis: 8,
};

export const normalizeTestingType = (value: string): string => {
  if (!value) {
    return "";
  }
  let normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  normalized = normalized.replace(/_+/g, "_");
  normalized = normalized.replace(/^_/, "").replace(/_$/, "");
  return normalized;
};

const mapToCostKey = (normalized: string): string => {
  if (!normalized) {
    return "basic_test";
  }
  if (BASIC_ALIASES.has(normalized)) {
    return "basic_test";
  }
  if (INTEGRATION_ALIASES.has(normalized)) {
    return "integration_test";
  }
  if (LOAD_ALIASES.has(normalized)) {
    return "load_test";
  }
  if (AI_ALIASES.has(normalized)) {
    return "ai_analysis";
  }
  return normalized;
};

export const getTokenCostForType = (value: string): number => {
  const key = mapToCostKey(normalizeTestingType(value));
  return TOKEN_COST_BY_KEY[key] ?? TOKEN_COST_BY_KEY.basic_test;
};

export const calculateRequiredTokens = (types: string[]): number => {
  if (!types || types.length === 0) {
    return 0;
  }
  return types.reduce((total, type) => total + getTokenCostForType(type), 0);
};

export const TOKEN_COST_REFERENCE: Array<{ label: string; cost: number }> = [
  { label: "Basic test", cost: TOKEN_COST_BY_KEY.basic_test },
  { label: "Integration test", cost: TOKEN_COST_BY_KEY.integration_test },
  { label: "Load test", cost: TOKEN_COST_BY_KEY.load_test },
  { label: "AI analysis", cost: TOKEN_COST_BY_KEY.ai_analysis },
];

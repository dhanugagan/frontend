import { describe, expect, it } from "vitest";
import { precheckCsvHeader, resultsToCsv } from "@/utils/csv";
import { fmtBytes, fmtInt, fmtMetric, fmtPct, fmtProb, histogram } from "@/utils/format";
import { toApiError, ApiError } from "@/services/client";

describe("format", () => {
  it("formats numbers and missing values", () => {
    expect(fmtInt(203769)).toBe("203,769");
    expect(fmtInt(null)).toBe("—");
    expect(fmtPct(9.76123)).toBe("9.76%");
    expect(fmtMetric(0.78924)).toBe("0.789");
    expect(fmtProb(0.5)).toBe("50.00%");
    expect(fmtBytes(10 * 1024 * 1024)).toBe("10.00 MB");
  });
  it("histogram bins probabilities and clamps 1.0 into the last bin", () => {
    const h = histogram([0, 0.05, 0.5, 1], 10);
    expect(h[0].count).toBe(2);
    expect(h[5].count).toBe(1);
    expect(h[9].count).toBe(1);
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(4);
  });
});

describe("csv helpers", () => {
  it("accepts a txId-only header", () => {
    const r = precheckCsvHeader("txId\n1\n2");
    expect(r.ok).toBe(true);
    expect(r.hasId).toBe(true);
  });
  it("rejects a missing id column, duplicates and binary content", () => {
    expect(precheckCsvHeader("a,b\n1,2").ok).toBe(false);
    expect(precheckCsvHeader("txId,txId\n1,1").ok).toBe(false);
    expect(precheckCsvHeader("txId\u0000\u0001").ok).toBe(false);
    expect(precheckCsvHeader("").ok).toBe(false);
  });
  it("exports exactly the returned rows", () => {
    const csv = resultsToCsv([{ row: 1, tx_id: 7, probability: 0.9, predicted_label: "illicit", ground_truth_label: null, in_dataset: true, time_step: 3 }], "graphsage", 0.5);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("probability");
    expect(lines[1]).toBe("1,7,3,0.9,illicit,0.5,graphsage,,true");
  });
});

describe("error normalisation", () => {
  it("passes ApiError through and maps unknown errors", () => {
    const e = new ApiError("unavailable", "x");
    expect(toApiError(e)).toBe(e);
    expect(toApiError(new Error("boom")).kind).toBe("http");
  });
});

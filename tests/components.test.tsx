import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GroundTruthBadge, PredictionBadge, SeverityBadge } from "@/components/Badge";
import { Column, DataTable, Pagination } from "@/components/DataTable";
import { ErrorState, Notice, UnavailableState } from "@/components/States";
import { UploadArea } from "@/components/UploadArea";
import { ApiError } from "@/services/client";

describe("labels", () => {
  it("keeps ground truth and prediction visually distinct", () => {
    render(<><GroundTruthBadge label="illicit" /><PredictionBadge label="illicit" /></>);
    expect(screen.getByText("GT")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });
  it("renders severities", () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });
});

describe("states", () => {
  it("explains an offline backend and offers retry", async () => {
    const retry = vi.fn();
    render(<ErrorState error={new ApiError("network", "Cannot reach the backend at http://x")} onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Backend not reachable");
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalled();
  });
  it("distinguishes unavailable from failed", () => {
    render(<ErrorState error={new ApiError("unavailable", "no verified model")} />);
    expect(screen.getByText("Not available in the backend")).toBeInTheDocument();
  });
  it("shows unavailable data without numbers", () => {
    render(<UnavailableState reason="No split summary." />);
    expect(screen.getByText("No split summary.")).toBeInTheDocument();
    render(<Notice title="T">body</Notice>);
  });
});

describe("DataTable", () => {
  interface R { id: number; v: string }
  const cols: Column<R>[] = [{ key: "id", header: "ID", sortKey: "id", render: (r) => r.id }, { key: "v", header: "Value", render: (r) => r.v }];
  it("selects, sorts and is keyboard operable", async () => {
    const pick = vi.fn(); const sort = vi.fn();
    render(<DataTable caption="t" columns={cols} rows={[{ id: 1, v: "a" }, { id: 2, v: "b" }]} rowKey={(r) => r.id} onRowClick={pick} onSort={sort} sort={{ key: "id", order: "asc" }} />);
    await userEvent.click(screen.getByText("b"));
    expect(pick).toHaveBeenCalledWith({ id: 2, v: "b" });
    await userEvent.click(screen.getByRole("button", { name: /id/i }));
    expect(sort).toHaveBeenCalledWith("id");
    fireEvent.keyDown(screen.getAllByRole("row")[1], { key: "Enter" });
    expect(pick).toHaveBeenCalledTimes(2);
  });
  it("paginates", async () => {
    const go = vi.fn();
    render(<Pagination page={2} pages={4} total={100} pageSize={25} onPage={go} />);
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(go).toHaveBeenCalledWith(3);
    expect(screen.getByText(/26–50/)).toBeInTheDocument();
  });
});

describe("UploadArea", () => {
  it("accepts a chosen file and shows its name and size", async () => {
    const onFile = vi.fn();
    const { rerender } = render(<UploadArea file={null} onFile={onFile} maxBytes={1024 * 1024} />);
    const f = new File(["txId\n1"], "batch.csv", { type: "text/csv" });
    await userEvent.upload(screen.getByTestId("file-input"), f);
    expect(onFile).toHaveBeenCalledWith(f);
    rerender(<UploadArea file={f} onFile={onFile} maxBytes={1024 * 1024} progress={0.5} />);
    expect(screen.getByTestId("file-name")).toHaveTextContent("batch.csv");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });
  it("supports drag and drop", () => {
    const onFile = vi.fn();
    render(<UploadArea file={null} onFile={onFile} maxBytes={null} />);
    const f = new File(["x"], "d.csv");
    fireEvent.drop(screen.getByTestId("upload-dropzone"), { dataTransfer: { files: [f] } });
    expect(onFile).toHaveBeenCalledWith(f);
  });
});

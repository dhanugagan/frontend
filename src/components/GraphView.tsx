import { useEffect, useMemo, useRef } from "react";
import cytoscape, { Core, ElementDefinition, LayoutOptions } from "cytoscape";
import type { CyEdge, CyNode } from "@/types/api";
import { COLORS } from "@/utils/palette";

export type LayoutName = "cose" | "breadthfirst" | "concentric" | "circle";

export interface GraphFilters {
  licit: boolean;
  illicit: boolean;
  unknown: boolean;
  predictedIllicitOnly: boolean;
}

interface Props {
  nodes: CyNode[];
  edges: CyEdge[];
  selectedId: string | null;
  centerId: string | null;
  highlightIds: Set<string>;
  filters: GraphFilters;
  layout: LayoutName;
  layoutVersion: number;
  onSelect: (id: string | null) => void;
  onExpand: (id: string) => void;
  onSelectEdge?: (edge: { source: string; target: string } | null) => void;
  headless?: boolean;
}

const STYLE: cytoscape.StylesheetJson = [
  { selector: "node", style: { "background-color": COLORS.unknown, width: 18, height: 18, label: "data(label)", color: "#b4b8c2", "font-size": 8, "text-valign": "bottom", "text-margin-y": 4, "text-opacity": 0, "border-width": 1.5, "border-color": "#050507", "overlay-opacity": 0 } },
  { selector: "node.illicit", style: { "background-color": COLORS.illicit } },
  { selector: "node.licit", style: { "background-color": COLORS.licit } },
  { selector: "node.unknown", style: { "background-color": COLORS.unknown } },
  { selector: "node.center", style: { width: 30, height: 30, "border-width": 3, "border-color": "#a3e635", "text-opacity": 1, "font-size": 10, "font-weight": 600 } },
  { selector: "node[predicted_label = 'illicit']", style: { "border-width": 3, "border-color": "#ecfccb", "border-style": "double" } },
  { selector: "node.hl", style: { "border-width": 3, "border-color": "#84cc16", "text-opacity": 1 } },
  { selector: "node:selected", style: { "border-width": 4, "border-color": "#ffffff", "text-opacity": 1 } },
  { selector: "node.dim", style: { opacity: 0.12 } },
  { selector: "node.hidden", style: { display: "none" } },
  { selector: "edge", style: { width: 1.2, "line-color": "#71717a", "target-arrow-color": "#71717a", "target-arrow-shape": "triangle", "curve-style": "bezier", "arrow-scale": 0.8, opacity: 0.7, "overlay-opacity": 0 } },
  { selector: "edge:selected", style: { "line-color": "#a3e635", "target-arrow-color": "#ffffff", width: 2.5, opacity: 1 } },
  { selector: "edge.dim", style: { opacity: 0.05 } },
  { selector: "edge.hidden", style: { display: "none" } },
] as unknown as cytoscape.StylesheetJson;

function layoutOptions(name: LayoutName, centerId: string | null): LayoutOptions {
  switch (name) {
    case "breadthfirst":
      return { name, directed: true, spacingFactor: 1.15, padding: 20, animate: false, roots: centerId ? `#${CSS_escape(centerId)}` : undefined } as LayoutOptions;
    case "concentric":
      return { name, animate: false, padding: 20, minNodeSpacing: 14, concentric: (n: cytoscape.NodeSingular) => 10 - Math.min(9, Number(n.data("depth") ?? 0)), levelWidth: () => 1 } as LayoutOptions;
    case "circle":
      return { name, animate: false, padding: 20 } as LayoutOptions;
    default:
      return { name: "cose", animate: false, padding: 24, nodeRepulsion: () => 9000, idealEdgeLength: () => 55, randomize: true } as LayoutOptions;
  }
}
const CSS_escape = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");

export function GraphView({ nodes, edges, selectedId, centerId, highlightIds, filters, layout, layoutVersion, onSelect, onExpand, onSelectEdge, headless }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const cb = useRef({ onSelect, onExpand, onSelectEdge });
  cb.current = { onSelect, onExpand, onSelectEdge };

  const elements = useMemo<ElementDefinition[]>(
    () => [...nodes.map((n) => ({ group: "nodes" as const, data: n.data as unknown as Record<string, unknown>, classes: n.classes })), ...edges.map((e) => ({ group: "edges" as const, data: e.data }))],
    [nodes, edges],
  );

  // create once
  useEffect(() => {
    if (!host.current) return;
    const inst = cytoscape({ container: headless ? undefined : host.current, headless: !!headless, style: STYLE, minZoom: 0.15, maxZoom: 3, wheelSensitivity: 0.25, boxSelectionEnabled: false });
    cy.current = inst;
    inst.on("tap", "node", (e) => cb.current.onSelect(e.target.id()));
    inst.on("dbltap", "node", (e) => cb.current.onExpand(e.target.id()));
    inst.on("tap", "edge", (e) => cb.current.onSelectEdge?.({ source: e.target.data("source"), target: e.target.data("target") }));
    inst.on("tap", (e) => {
      if (e.target === inst) {
        cb.current.onSelect(null);
        cb.current.onSelectEdge?.(null);
      }
    });
    return () => {
      inst.destroy();
      cy.current = null;
    };
  }, [headless]);

  // sync elements (incremental: keeps positions of existing nodes), re-layout when topology changes or the layout is requested
  const lastSig = useRef("");
  useEffect(() => {
    const inst = cy.current;
    if (!inst) return;
    const ids = new Set(elements.map((e) => String(e.data.id)));
    inst.batch(() => {
      inst.elements().filter((el) => !ids.has(el.id())).remove();
      const fresh = elements.filter((e) => inst.getElementById(String(e.data.id)).empty());
      if (fresh.length) inst.add(fresh);
      elements.forEach((e) => {
        if (e.group === "nodes") {
          const el = inst.getElementById(String(e.data.id));
          el.data(e.data);
          el.classes((e.classes as string) ?? "");
        }
      });
    });
    const sig = `${elements.length}:${layout}:${layoutVersion}:${centerId}`;
    if (sig !== lastSig.current && inst.nodes().length) {
      lastSig.current = sig;
      inst.layout(layoutOptions(layout, centerId)).run();
      inst.fit(undefined, 30);
    }
  }, [elements, layout, layoutVersion, centerId]);

  // filters / highlight / selection
  useEffect(() => {
    const inst = cy.current;
    if (!inst) return;
    inst.batch(() => {
      inst.nodes().forEach((n) => {
        const gt = n.data("ground_truth_label") as string;
        let hide = (gt === "licit" && !filters.licit) || (gt === "illicit" && !filters.illicit) || (gt === "unknown" && !filters.unknown);
        if (filters.predictedIllicitOnly && n.data("predicted_label") !== "illicit") hide = true;
        n.toggleClass("hidden", hide);
        n.toggleClass("hl", highlightIds.has(n.id()));
      });
      inst.edges().forEach((e) => { e.toggleClass("hidden", e.source().hasClass("hidden") || e.target().hasClass("hidden")); });
      inst.nodes().unselect();
      if (selectedId) inst.getElementById(selectedId).select();
    });
  }, [filters, highlightIds, selectedId, elements]);

  return <div ref={host} data-testid="cy-container" className="cy-container h-full w-full" role="application" aria-label="Transaction graph. Click a node for details, double-click to expand its neighbourhood." />;
}

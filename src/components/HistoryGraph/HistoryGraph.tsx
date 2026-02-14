import { useEffect, useRef, useCallback } from 'react';
import ForceGraph3D from '3d-force-graph';
import type { ForceGraphInstance, ForceGraphNode, ForceGraphLink } from '3d-force-graph';
import type { HistoryEntry } from '../../types/chord';
import { buildHistoryGraph } from '../../utils/historyGraph';
import type { HistoryGraphNode, HistoryGraphLink } from '../../utils/historyGraph';

const COLOR_GOLD = '#f5c542';
const COLOR_GOLD_DIM = 'rgba(245, 197, 66, 0.4)';
const COLOR_PURPLE = '#c850c0';
const COLOR_PURPLE_DIM = 'rgba(200, 80, 192, 0.3)';
const BG_COLOR = '#0a0e1a';

interface HistoryGraphProps {
  history: HistoryEntry[];
}

export function HistoryGraph({ history }: HistoryGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphInstance | null>(null);

  const initGraph = useCallback(() => {
    if (!containerRef.current || graphRef.current) return;

    const graph = ForceGraph3D()(containerRef.current)
      .backgroundColor(BG_COLOR)
      .nodeId('id')
      .nodeLabel((node: ForceGraphNode) => {
        const n = node as HistoryGraphNode;
        const countLabel = n.playCount > 0 ? ` (played ${n.playCount}x)` : ' (unchosen)';
        return `<div style="
          background: rgba(10, 14, 26, 0.9);
          border: 1px solid ${n.wasPlayed ? COLOR_GOLD : COLOR_PURPLE};
          border-radius: 8px;
          padding: 6px 10px;
          color: #f0e6d3;
          font-family: Inter, system-ui, sans-serif;
          font-size: 12px;
        ">${n.name}${countLabel}</div>`;
      })
      .nodeColor((node: ForceGraphNode) => {
        const n = node as HistoryGraphNode;
        return n.wasPlayed ? COLOR_GOLD : COLOR_PURPLE_DIM;
      })
      .nodeVal((node: ForceGraphNode) => {
        const n = node as HistoryGraphNode;
        return n.wasPlayed ? 2 + n.playCount : 1;
      })
      .nodeRelSize(5)
      .nodeOpacity(0.9)
      .linkColor((link: ForceGraphLink) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? COLOR_GOLD_DIM : COLOR_PURPLE_DIM;
      })
      .linkWidth((link: ForceGraphLink) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? 2 + l.count * 0.5 : 0.5;
      })
      .linkOpacity(0.6)
      .linkDirectionalParticles((link: ForceGraphLink) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? 2 : 0;
      })
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleColor((link: ForceGraphLink) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? COLOR_GOLD : COLOR_PURPLE;
      })
      .onNodeClick((node: ForceGraphNode) => {
        const distance = 120;
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        const z = node.z ?? 0;
        graph.cameraPosition(
          { x: x + distance, y: y + distance / 2, z: z + distance },
          { x, y, z },
          1000,
        );
      })
      .cooldownTicks(100)
      .warmupTicks(50);

    graphRef.current = graph;
  }, []);

  // Initialize graph on mount
  useEffect(() => {
    initGraph();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        graphRef.current?.width(width).height(height);
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
  }, [initGraph]);

  // Update graph data when history changes
  useEffect(() => {
    if (!graphRef.current) return;
    const data = buildHistoryGraph(history);
    graphRef.current.graphData(data);
  }, [history]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
}

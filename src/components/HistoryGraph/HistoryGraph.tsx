import { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph3D from '3d-force-graph';
import ForceGraph2D from 'force-graph';
import type { ForceGraphInstance, ForceGraphNode as ForceGraphNode3D, ForceGraphLink as ForceGraphLink3D } from '3d-force-graph';
import type { ForceGraph2DInstance, ForceGraphNode as ForceGraphNode2D, ForceGraphLink as ForceGraphLink2D } from 'force-graph';
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

type GraphMode = '2d' | '3d';

const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(245, 197, 66, 0.15)' : 'rgba(10, 14, 26, 0.6)',
  border: `1px solid ${active ? 'rgba(245, 197, 66, 0.4)' : 'rgba(245, 197, 66, 0.1)'}`,
  borderRadius: 6,
  padding: '4px 12px',
  color: active ? '#f5c542' : 'rgba(240, 230, 211, 0.5)',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  fontFamily: 'inherit',
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
  transition: 'all 0.2s',
});

export function HistoryGraph({ history }: HistoryGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graph3DRef = useRef<ForceGraphInstance | null>(null);
  const graph2DRef = useRef<ForceGraph2DInstance | null>(null);
  const [mode, setMode] = useState<GraphMode>('3d');

  const init3DGraph = useCallback(() => {
    if (!containerRef.current || graph3DRef.current) return;

    const graph = ForceGraph3D()(containerRef.current)
      .backgroundColor(BG_COLOR)
      .nodeId('id')
      .nodeLabel((node: ForceGraphNode3D) => {
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
      .nodeColor((node: ForceGraphNode3D) => {
        const n = node as HistoryGraphNode;
        return n.wasPlayed ? COLOR_GOLD : COLOR_PURPLE_DIM;
      })
      .nodeVal((node: ForceGraphNode3D) => {
        const n = node as HistoryGraphNode;
        return n.wasPlayed ? 2 + n.playCount : 1;
      })
      .nodeRelSize(5)
      .nodeOpacity(0.9)
      .linkColor((link: ForceGraphLink3D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? COLOR_GOLD_DIM : COLOR_PURPLE_DIM;
      })
      .linkWidth((link: ForceGraphLink3D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? 2 + l.count * 0.5 : 0.5;
      })
      .linkOpacity(0.6)
      .linkDirectionalParticles((link: ForceGraphLink3D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? 2 : 0;
      })
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleColor((link: ForceGraphLink3D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? COLOR_GOLD : COLOR_PURPLE;
      })
      .onNodeClick((node: ForceGraphNode3D) => {
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

    graph3DRef.current = graph;
  }, []);

  const init2DGraph = useCallback(() => {
    if (!containerRef.current || graph2DRef.current) return;

    const graph = ForceGraph2D()(containerRef.current)
      .backgroundColor(BG_COLOR)
      .nodeId('id')
      .nodeLabel((node: ForceGraphNode2D) => {
        const n = node as HistoryGraphNode;
        const countLabel = n.playCount > 0 ? ` (played ${n.playCount}x)` : ' (unchosen)';
        return `${n.name}${countLabel}`;
      })
      .nodeColor((node: ForceGraphNode2D) => {
        const n = node as HistoryGraphNode;
        return n.wasPlayed ? COLOR_GOLD : COLOR_PURPLE_DIM;
      })
      .nodeVal((node: ForceGraphNode2D) => {
        const n = node as HistoryGraphNode;
        return n.wasPlayed ? 3 + n.playCount * 2 : 1;
      })
      .nodeRelSize(6)
      .nodeCanvasObject((node: ForceGraphNode2D, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const n = node as HistoryGraphNode;
        const label = n.name;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

        const x = node.x ?? 0;
        const y = node.y ?? 0;

        ctx.fillStyle = 'rgba(10, 14, 26, 0.8)';
        ctx.fillRect(x - bckgDimensions[0] / 2, y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = n.wasPlayed ? COLOR_GOLD : COLOR_PURPLE_DIM;
        ctx.fillText(label, x, y);
      })
      .nodeCanvasObjectMode(() => 'after')
      .linkColor((link: ForceGraphLink2D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? COLOR_GOLD_DIM : COLOR_PURPLE_DIM;
      })
      .linkWidth((link: ForceGraphLink2D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? 2 + l.count * 0.5 : 0.5;
      })
      .linkDirectionalParticles((link: ForceGraphLink2D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? 2 : 0;
      })
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleColor((link: ForceGraphLink2D) => {
        const l = link as HistoryGraphLink;
        return l.wasChosen ? COLOR_GOLD : COLOR_PURPLE;
      })
      .onNodeClick((node: ForceGraphNode2D) => {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        graph.centerAt(x, y, 1000);
        graph.zoom(2, 1000);
      })
      .d3Force('charge', null)
      .d3Force('center', null)
      .d3Force('x', null)
      .d3Force('y', null)
      .d3Force('link', null)
      .cooldownTicks(0)
      .warmupTicks(0);

    graph2DRef.current = graph;
  }, []);

  // Initialize the appropriate graph based on mode
  useEffect(() => {
    if (mode === '3d') {
      init3DGraph();
    } else {
      init2DGraph();
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (mode === '3d') {
          graph3DRef.current?.width(width).height(height);
        } else {
          graph2DRef.current?.width(width).height(height);
        }
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [mode, init3DGraph, init2DGraph]);

  // Cleanup when switching modes or unmounting
  useEffect(() => {
    return () => {
      if (graph3DRef.current) {
        graph3DRef.current._destructor();
        graph3DRef.current = null;
      }
      if (graph2DRef.current) {
        graph2DRef.current._destructor();
        graph2DRef.current = null;
      }
    };
  }, [mode]);

  // Update graph data when history changes
  useEffect(() => {
    const data = buildHistoryGraph(history);

    if (mode === '3d' && graph3DRef.current) {
      graph3DRef.current.graphData(data);
    } else if (mode === '2d' && graph2DRef.current) {
      // For 2D: assign fixed positions based on temporal order
      const stepGroups = new Map<number, HistoryGraphNode[]>();

      // Group nodes by their first seen step
      data.nodes.forEach((node) => {
        const step = node.firstSeenStep;
        if (!stepGroups.has(step)) {
          stepGroups.set(step, []);
        }
        stepGroups.get(step)!.push(node);
      });

      // Assign positions: x = step, y = index within step
      const spacing = 250;
      const verticalSpacing = 100;

      data.nodes.forEach((node) => {
        const group = stepGroups.get(node.firstSeenStep)!;
        const indexInGroup = group.indexOf(node);
        const groupSize = group.length;

        node.fx = node.firstSeenStep * spacing;
        node.fy = (indexInGroup - (groupSize - 1) / 2) * verticalSpacing;
      });

      graph2DRef.current.graphData(data);
    }
  }, [history, mode]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 2D/3D Toggle */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        gap: 4,
        padding: 4,
        background: 'rgba(10, 14, 26, 0.85)',
        border: '1px solid rgba(245, 197, 66, 0.15)',
        borderRadius: 8,
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <button style={toggleButtonStyle(mode === '2d')} onClick={() => setMode('2d')}>
          2D
        </button>
        <button style={toggleButtonStyle(mode === '3d')} onClick={() => setMode('3d')}>
          3D
        </button>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />
    </div>
  );
}

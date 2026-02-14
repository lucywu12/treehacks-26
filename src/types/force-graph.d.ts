declare module 'force-graph' {
  export interface ForceGraphNode {
    id: string;
    name?: string;
    val?: number;
    color?: string;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
    [key: string]: unknown;
  }

  export interface ForceGraphLink {
    source: string | ForceGraphNode;
    target: string | ForceGraphNode;
    color?: string;
    width?: number;
    [key: string]: unknown;
  }

  export interface ForceGraph2DInstance {
    // Data
    graphData(data?: { nodes: ForceGraphNode[]; links: ForceGraphLink[] }): ForceGraph2DInstance & { nodes: ForceGraphNode[]; links: ForceGraphLink[] };
    jsonUrl(url: string): ForceGraph2DInstance;
    nodeId(id: string): ForceGraph2DInstance;

    // Container
    width(width?: number): ForceGraph2DInstance;
    height(height?: number): ForceGraph2DInstance;
    backgroundColor(color: string): ForceGraph2DInstance;

    // Node styling
    nodeLabel(accessor: string | ((node: ForceGraphNode) => string)): ForceGraph2DInstance;
    nodeColor(accessor: string | ((node: ForceGraphNode) => string)): ForceGraph2DInstance;
    nodeVal(accessor: string | number | ((node: ForceGraphNode) => number)): ForceGraph2DInstance;
    nodeRelSize(size: number): ForceGraph2DInstance;
    nodeCanvasObject(painter: ((node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => void) | null): ForceGraph2DInstance;
    nodeCanvasObjectMode(mode: string | ((node: ForceGraphNode) => string)): ForceGraph2DInstance;

    // Link styling
    linkColor(accessor: string | ((link: ForceGraphLink) => string)): ForceGraph2DInstance;
    linkWidth(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraph2DInstance;
    linkDirectionalParticles(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraph2DInstance;
    linkDirectionalParticleWidth(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraph2DInstance;
    linkDirectionalParticleSpeed(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraph2DInstance;
    linkDirectionalParticleColor(accessor: string | ((link: ForceGraphLink) => string)): ForceGraph2DInstance;

    // Interaction
    onNodeClick(callback: ((node: ForceGraphNode, event: MouseEvent) => void) | null): ForceGraph2DInstance;
    onNodeHover(callback: ((node: ForceGraphNode | null, prevNode: ForceGraphNode | null) => void) | null): ForceGraph2DInstance;
    onLinkClick(callback: ((link: ForceGraphLink, event: MouseEvent) => void) | null): ForceGraph2DInstance;

    // Zoom/pan
    zoom(scale?: number, duration?: number): ForceGraph2DInstance;
    centerAt(x?: number, y?: number, duration?: number): ForceGraph2DInstance;

    // Force engine
    d3Force(forceName: string, force?: unknown): ForceGraph2DInstance & unknown;
    d3ReheatSimulation(): ForceGraph2DInstance;
    cooldownTicks(ticks: number): ForceGraph2DInstance;
    warmupTicks(ticks: number): ForceGraph2DInstance;

    // Lifecycle
    _destructor(): void;
  }

  export default function ForceGraph(configOptions?: { controlType?: string }): (element: HTMLElement) => ForceGraph2DInstance;
}

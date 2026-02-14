declare module '3d-force-graph' {
  import type { Object3D, Scene, Camera, WebGLRenderer } from 'three';

  export interface ForceGraphNode {
    id: string;
    name?: string;
    val?: number;
    color?: string;
    x?: number;
    y?: number;
    z?: number;
    fx?: number;
    fy?: number;
    fz?: number;
    [key: string]: unknown;
  }

  export interface ForceGraphLink {
    source: string | ForceGraphNode;
    target: string | ForceGraphNode;
    color?: string;
    width?: number;
    [key: string]: unknown;
  }

  export interface ForceGraphInstance {
    // Data
    graphData(data?: { nodes: ForceGraphNode[]; links: ForceGraphLink[] }): ForceGraphInstance & { nodes: ForceGraphNode[]; links: ForceGraphLink[] };
    jsonUrl(url: string): ForceGraphInstance;
    nodeId(id: string): ForceGraphInstance;

    // Container
    width(width?: number): ForceGraphInstance;
    height(height?: number): ForceGraphInstance;
    backgroundColor(color: string): ForceGraphInstance;

    // Node styling
    nodeLabel(accessor: string | ((node: ForceGraphNode) => string)): ForceGraphInstance;
    nodeColor(accessor: string | ((node: ForceGraphNode) => string)): ForceGraphInstance;
    nodeVal(accessor: string | number | ((node: ForceGraphNode) => number)): ForceGraphInstance;
    nodeRelSize(size: number): ForceGraphInstance;
    nodeOpacity(opacity: number): ForceGraphInstance;
    nodeThreeObject(accessor: ((node: ForceGraphNode) => Object3D) | null): ForceGraphInstance;

    // Link styling
    linkColor(accessor: string | ((link: ForceGraphLink) => string)): ForceGraphInstance;
    linkWidth(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraphInstance;
    linkOpacity(opacity: number): ForceGraphInstance;
    linkDirectionalParticles(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraphInstance;
    linkDirectionalParticleWidth(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraphInstance;
    linkDirectionalParticleSpeed(accessor: string | number | ((link: ForceGraphLink) => number)): ForceGraphInstance;
    linkDirectionalParticleColor(accessor: string | ((link: ForceGraphLink) => string)): ForceGraphInstance;

    // Interaction
    onNodeClick(callback: ((node: ForceGraphNode, event: MouseEvent) => void) | null): ForceGraphInstance;
    onNodeHover(callback: ((node: ForceGraphNode | null, prevNode: ForceGraphNode | null) => void) | null): ForceGraphInstance;
    onLinkClick(callback: ((link: ForceGraphLink, event: MouseEvent) => void) | null): ForceGraphInstance;

    // Camera
    cameraPosition(position?: { x?: number; y?: number; z?: number }, lookAt?: { x?: number; y?: number; z?: number }, transitionMs?: number): ForceGraphInstance;

    // Force engine
    d3Force(forceName: string, force?: unknown): ForceGraphInstance & unknown;
    d3ReheatSimulation(): ForceGraphInstance;
    cooldownTicks(ticks: number): ForceGraphInstance;
    warmupTicks(ticks: number): ForceGraphInstance;

    // Lifecycle
    _destructor(): void;

    // Access internals
    scene(): Scene;
    camera(): Camera;
    renderer(): WebGLRenderer;
    controls(): unknown;
  }

  export default function ForceGraph3D(configOptions?: { controlType?: string }): (element: HTMLElement) => ForceGraphInstance;
}

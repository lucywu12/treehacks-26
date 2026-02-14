import type { HistoryEntry } from '../types/chord';
import type { ForceGraphNode, ForceGraphLink } from '3d-force-graph';

export interface HistoryGraphNode extends ForceGraphNode {
  id: string;
  name: string;
  playCount: number;
  wasPlayed: boolean;
  firstSeenStep: number;
}

export interface HistoryGraphLink extends ForceGraphLink {
  source: string;
  target: string;
  wasChosen: boolean;
  count: number;
}

export interface HistoryGraphData {
  nodes: HistoryGraphNode[];
  links: HistoryGraphLink[];
}

export function buildHistoryGraph(history: HistoryEntry[]): HistoryGraphData {
  const nodeMap = new Map<string, HistoryGraphNode>();
  const linkMap = new Map<string, HistoryGraphLink>();

  function ensureNode(chordId: string, wasPlayed: boolean, step: number) {
    const existing = nodeMap.get(chordId);
    if (existing) {
      if (wasPlayed) {
        existing.playCount++;
        existing.wasPlayed = true;
      }
    } else {
      nodeMap.set(chordId, {
        id: chordId,
        name: chordId,
        playCount: wasPlayed ? 1 : 0,
        wasPlayed,
        firstSeenStep: step,
      });
    }
  }

  function ensureLink(sourceId: string, targetId: string, wasChosen: boolean) {
    const key = `${sourceId}->${targetId}`;
    const existing = linkMap.get(key);
    if (existing) {
      existing.count++;
      if (wasChosen) existing.wasChosen = true;
    } else {
      linkMap.set(key, {
        source: sourceId,
        target: targetId,
        wasChosen,
        count: 1,
      });
    }
  }

  for (let step = 0; step < history.length; step++) {
    const entry = history[step];
    const currentId = entry.current.chordId;
    ensureNode(currentId, true, step);

    for (let i = 0; i < entry.next.length; i++) {
      const nextId = entry.next[i].chordId;
      const isChosen = i === entry.chosenIndex;

      ensureNode(nextId, isChosen, step + 1);
      ensureLink(currentId, nextId, isChosen);
    }
  }

  // Also mark the final chosen chord as played (it's the destination of the last entry)
  if (history.length > 0) {
    const last = history[history.length - 1];
    const finalChordId = last.next[last.chosenIndex].chordId;
    ensureNode(finalChordId, true, history.length);
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values()),
  };
}

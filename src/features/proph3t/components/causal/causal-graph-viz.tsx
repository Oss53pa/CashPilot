import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CausalGraph, CausalGraphNode, CausalGraphEdge } from './causal-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<CausalGraphNode['category'], string> = {
  revenue: '#22c55e',
  expense: '#ef4444',
  external: '#3b82f6',
  position: '#111827',
};

const CATEGORY_LABELS: Record<CausalGraphNode['category'], string> = {
  revenue: 'Revenu',
  expense: 'Depense',
  external: 'Externe',
  position: 'Position',
};

function nodeById(nodes: CausalGraphNode[], id: string) {
  return nodes.find((n) => n.id === id);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CausalGraphVizProps {
  graph: CausalGraph;
}

export function CausalGraphViz({ graph }: CausalGraphVizProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<CausalGraphEdge | null>(null);

  const { nodes, edges } = graph;

  // Highlighted edges when a node is selected
  const highlightedEdges = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNodeId || e.target === selectedNodeId) {
        set.add(`${e.source}-${e.target}`);
      }
    });
    return set;
  }, [selectedNodeId, edges]);

  // Selected node detail
  const selectedNode = selectedNodeId ? nodeById(nodes, selectedNodeId) : null;
  const incomingEdges = selectedNodeId ? edges.filter((e) => e.target === selectedNodeId) : [];
  const outgoingEdges = selectedNodeId ? edges.filter((e) => e.source === selectedNodeId) : [];

  // SVG viewport
  const svgWidth = 820;
  const svgHeight = 540;
  const nodeRadius = 28;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Graph */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Graphe Causal</CardTitle>
          <CardDescription>Cliquez sur un noeud pour voir ses causes et effets</CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
            style={{ minHeight: 400 }}
          >
            <defs>
              <marker id="arrowhead-default" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
              <marker id="arrowhead-highlight" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker id="arrowhead-prevent" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge) => {
              const src = nodeById(nodes, edge.source);
              const tgt = nodeById(nodes, edge.target);
              if (!src || !tgt || src.x == null || src.y == null || tgt.x == null || tgt.y == null) return null;

              const edgeKey = `${edge.source}-${edge.target}`;
              const isHighlighted = highlightedEdges.size === 0 || highlightedEdges.has(edgeKey);
              const opacity = highlightedEdges.size === 0 ? 0.5 : isHighlighted ? 1 : 0.1;
              const strokeWidth = 1 + edge.strength * 4;

              // Shorten line to not overlap node circles
              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const offsetSrc = nodeRadius / dist;
              const offsetTgt = (nodeRadius + 10) / dist;

              const x1 = src.x + dx * offsetSrc;
              const y1 = src.y + dy * offsetSrc;
              const x2 = tgt.x - dx * offsetTgt;
              const y2 = tgt.y - dy * offsetTgt;

              const markerId = edge.direction === 'prevents'
                ? 'arrowhead-prevent'
                : isHighlighted && highlightedEdges.size > 0
                  ? 'arrowhead-highlight'
                  : 'arrowhead-default';

              return (
                <line
                  key={edgeKey}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edge.direction === 'prevents' ? '#f97316' : isHighlighted && highlightedEdges.size > 0 ? '#3b82f6' : '#94a3b8'}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  markerEnd={`url(#${markerId})`}
                  strokeDasharray={edge.direction === 'prevents' ? '6 3' : undefined}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              if (node.x == null || node.y == null) return null;
              const isSelected = node.id === selectedNodeId;
              const isDimmed = highlightedEdges.size > 0 && !isSelected && !incomingEdges.some((e) => e.source === node.id) && !outgoingEdges.some((e) => e.target === node.id);
              const color = CATEGORY_COLORS[node.category];

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                  opacity={isDimmed ? 0.2 : 1}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={nodeRadius + 4} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 2" />
                  )}
                  <circle cx={node.x} cy={node.y} r={nodeRadius} fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[9px] font-medium fill-foreground select-none pointer-events-none"
                  >
                    {node.label.length > 16
                      ? (
                        <>
                          <tspan x={node.x} dy="-0.4em">{node.label.substring(0, 14)}</tspan>
                          <tspan x={node.x} dy="1.1em">{node.label.substring(14)}</tspan>
                        </>
                      )
                      : node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Edge tooltip */}
          {hoveredEdge && (
            <div className="mt-2 rounded-lg border bg-muted/50 px-4 py-2 text-xs">
              <p className="font-medium">
                {nodeById(nodes, hoveredEdge.source)?.label} {hoveredEdge.direction === 'causes' ? '\u2192' : '\u2298'} {nodeById(nodes, hoveredEdge.target)?.label}
              </p>
              <p className="text-muted-foreground mt-1">{hoveredEdge.description}</p>
              <div className="flex gap-4 mt-1">
                <span>Force: <strong>{(hoveredEdge.strength * 100).toFixed(0)}%</strong></span>
                <span>Confiance: <strong>{(hoveredEdge.confidence * 100).toFixed(0)}%</strong></span>
                {hoveredEdge.lag_days != null && hoveredEdge.lag_days > 0 && (
                  <span>Delai: <strong>{hoveredEdge.lag_days}j</strong></span>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 px-2 text-xs">
            {(Object.keys(CATEGORY_COLORS) as CausalGraphNode['category'][]).map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <span>{CATEGORY_LABELS[cat]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="inline-block h-0.5 w-6 bg-slate-400" />
              <span>Cause</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-orange-500" />
              <span>Previent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node detail panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detail du noeud</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedNode ? (
            <p className="text-sm text-muted-foreground">Selectionnez un noeud dans le graphe pour voir ses relations causales.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[selectedNode.category] }} />
                  <span className="font-semibold text-sm">{selectedNode.label}</span>
                </div>
                <Badge variant="outline" className="mt-1 text-xs">{CATEGORY_LABELS[selectedNode.category]}</Badge>
              </div>

              {/* Incoming */}
              {incomingEdges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Causes (entrees)</p>
                  <div className="space-y-1.5">
                    {incomingEdges.map((e) => (
                      <div key={e.source} className="rounded border px-2 py-1.5 text-xs">
                        <span className="font-medium">{nodeById(nodes, e.source)?.label}</span>
                        <span className="text-muted-foreground ml-1">({(e.strength * 100).toFixed(0)}%)</span>
                        {e.lag_days != null && e.lag_days > 0 && <span className="text-muted-foreground ml-1">| delai {e.lag_days}j</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing */}
              {outgoingEdges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Effets (sorties)</p>
                  <div className="space-y-1.5">
                    {outgoingEdges.map((e) => (
                      <div key={e.target} className="rounded border px-2 py-1.5 text-xs">
                        <span className="font-medium">{nodeById(nodes, e.target)?.label}</span>
                        <span className="text-muted-foreground ml-1">({(e.strength * 100).toFixed(0)}%)</span>
                        {e.lag_days != null && e.lag_days > 0 && <span className="text-muted-foreground ml-1">| delai {e.lag_days}j</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

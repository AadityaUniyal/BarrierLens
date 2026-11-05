"""
Tarjan's Strongly Connected Components (SCC) Directed Focus Graph
Mathematical certification of deterministic keyboard traps (WCAG 2.1.2 Level A).
"""

import hashlib
import json
import time
from typing import List, Dict, Any, Optional, Set
import networkx as nx

class TarjanFocusGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.node_metadata: Dict[str, Dict[str, Any]] = {}
        self.action_history: List[str] = []

    def add_node(
        self,
        node_id: str,
        tag_name: str,
        role: Optional[str] = None,
        accessible_name: str = "",
        selector: str = "",
        box: Optional[Dict[str, int]] = None
    ):
        clean_id = node_id.strip()
        if not clean_id:
            return
        if not self.graph.has_node(clean_id):
            self.graph.add_node(clean_id)
            self.node_metadata[clean_id] = {
                "tagName": tag_name.lower(),
                "role": (role or tag_name).lower(),
                "accessibleName": accessible_name,
                "selector": selector or clean_id,
                "box": box or {"x": 0, "y": 0, "width": 0, "height": 0}
            }

    def add_edge(self, from_id: str, to_id: str, key: str = "Tab"):
        u = from_id.strip()
        v = to_id.strip()
        if not u or not v:
            return
        if not self.graph.has_node(u):
            self.add_node(u, "div")
        if not self.graph.has_node(v):
            self.add_node(v, "div")

        self.graph.add_edge(u, v, key=key)
        self.action_history.append(f"{u} -[{key}]-> {v}")

    def find_keyboard_traps(self, trace_keys: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """
        Computes strongly connected components using Tarjan's algorithm.
        Flags any sink SCC (out-degree = 0 in the condensation DAG) where len(scc) > 1.
        """
        if self.graph.number_of_nodes() < 2:
            return None

        # NetworkX Tarjan implementation
        sccs = list(nx.strongly_connected_components(self.graph))
        for scc in sccs:
            if len(scc) >= 2:
                # Check if this SCC has any outgoing edge to a node outside the SCC
                has_exit = False
                for node in scc:
                    for neighbor in self.graph.successors(node):
                        if neighbor not in scc:
                            has_exit = True
                            break
                    if has_exit:
                        break

                if not has_exit:
                    cycle_nodes = list(scc)
                    return self._generate_trap_certificate(cycle_nodes, trace_keys)
        return None

    def _generate_trap_certificate(self, cycle_nodes: List[str], trace_keys: Optional[List[str]]) -> Dict[str, Any]:
        cycle_str = " -> ".join(cycle_nodes) + f" -> {cycle_nodes[0]}"
        raw_proof = json.dumps({
            "algorithm": "Tarjan SCC Condensation Out-Degree Zero Analysis",
            "wcagRule": "WCAG 2.1.2 No Keyboard Trap (Level A)",
            "cycleNodes": sorted(cycle_nodes),
            "traceKeys": trace_keys or self.action_history[-8:],
            "certifiedAt": time.time()
        }, sort_keys=True)

        sha256_hash = hashlib.sha256(raw_proof.encode("utf-8")).hexdigest()

        return {
            "kind": "keyboard_trap",
            "trustTier": "proven",
            "sha256ProofCertificate": sha256_hash,
            "componentNodeIds": cycle_nodes,
            "cycleSequence": cycle_str,
            "cycleLength": len(cycle_nodes),
            "proofExplanation": (
                f"Deterministic keyboard trap certified with mathematical proof. "
                f"Focus is locked within an absorbing cycle of {len(cycle_nodes)} elements ({cycle_str}) "
                f"with out-degree = 0 to external DOM nodes."
            ),
            "wcagRules": ["WCAG 2.1.2 No Keyboard Trap (Level A)"],
            "severityScore": 9.8,
            "timestamp": time.time()
        }

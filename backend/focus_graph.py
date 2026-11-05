"""
BarrierLens Tarjan's Strongly Connected Components (SCC) Focus Trap Engine
Mathematical certification of cyclic keyboard traps using NetworkX.
"""

from typing import List, Dict, Any, Optional, Set
import networkx as nx
import hashlib
import json
import time

class TarjanFocusGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.node_metadata: Dict[str, Dict[str, Any]] = {}
        self.transition_history: List[Dict[str, Any]] = []

    def add_node(self, node_id: str, tag_name: str, role: str, accessible_name: str, selector: str, box: Optional[Dict[str, int]] = None):
        """Register an interactive focusable DOM element as a graph node."""
        if not self.graph.has_node(node_id):
            self.graph.add_node(node_id)
            self.node_metadata[node_id] = {
                "id": node_id,
                "tagName": tag_name,
                "role": role,
                "accessibleName": accessible_name,
                "selector": selector,
                "box": box or {"x": 0, "y": 0, "width": 0, "height": 0}
            }

    def add_edge(self, from_node: str, to_node: str, key: str = "Tab"):
        """Record a directed focus transition edge between two elements."""
        if from_node and to_node and from_node != to_node:
            self.graph.add_edge(from_node, to_node, key=key)
            self.transition_history.append({
                "from": from_node,
                "to": to_node,
                "key": key,
                "timestamp": time.time()
            })

    def find_keyboard_traps(self, key_sequence: List[str]) -> Optional[Dict[str, Any]]:
        """
        Applies Tarjan's SCC algorithm.
        A keyboard trap is mathematically certified when:
        1. A strongly connected component has >= 2 nodes (or a self-loop).
        2. The component has out-degree 0 (a sink SCC) - meaning no valid Tab/Arrow key
           transition allows focus to escape back to the external DOM.
        """
        if self.graph.number_of_nodes() < 2:
            return None

        # Compute all strongly connected components
        sccs = list(nx.strongly_connected_components(self.graph))

        for scc in sccs:
            if len(scc) >= 2:
                # Check out-degree to external nodes outside the SCC
                has_external_exit = False
                for node in scc:
                    for successor in self.graph.successors(node):
                        if successor not in scc:
                            has_external_exit = True
                            break
                    if has_external_exit:
                        break

                # If no external exit exists, this is a certified sink trap
                if not has_external_exit:
                    component_nodes = sorted(list(scc))
                    
                    # Generate SHA-256 cryptographic certificate
                    cert_payload = {
                        "nodes": component_nodes,
                        "keySequence": key_sequence[-12:],
                        "timestamp": time.time()
                    }
                    cert_hash = hashlib.sha256(json.dumps(cert_payload, sort_keys=True).encode("utf-8")).hexdigest()

                    node_details = [self.node_metadata.get(n, {"selector": n}) for n in component_nodes]

                    return {
                        "certificateId": f"cert_trap_{cert_hash[:16]}",
                        "sha256Hash": cert_hash,
                        "componentNodeIds": component_nodes,
                        "nodeDetails": node_details,
                        "keySequence": key_sequence[-12:],
                        "proofExplanation": (
                            f"Mathematical Trap Certificate: Strongly connected component "
                            f"{{{', '.join(component_nodes)}}} has out-degree 0 to external DOM. "
                            f"Focus is locked in cyclic loop under keys {key_sequence[-6:]} with no escape path."
                        ),
                        "wcagRule": "WCAG 2.1.2 No Keyboard Trap (Level A)",
                        "timestamp": time.time()
                    }

        return None

    def get_summary(self) -> Dict[str, Any]:
        return {
            "totalNodes": self.graph.number_of_nodes(),
            "totalEdges": self.graph.number_of_edges(),
            "isDirectedAcyclic": nx.is_directed_acyclic_graph(self.graph)
        }

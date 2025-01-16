import type { Edge, Node } from "@xyflow/react";

export type FlowStateMessage = {
  nodes: Node[];
  edges: Edge[];
};

export type StateChangeMessage =
  | {
      type: "node";
      nodes: Node[];
    }
  | {
      type: "edge";
      edges: Edge[];
    };

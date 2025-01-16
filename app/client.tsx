import React, { useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  applyNodeChanges,
  type NodeChange,
  type EdgeChange,
  applyEdgeChanges,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { createRoot } from "react-dom/client";
import usePartySocket from "partysocket/react";
import type {
  FlowStateMessage,
  StateChangeMessage,
} from "../types/flow-state-message.type";

export default function App() {
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  // Get the room name from the URL search params (if any)
  // This allows multiple "rooms" to be created on the same server, each with their own state
  const room =
    new URLSearchParams(window.location.search).get("room") ?? "flow-room";

  const socket = usePartySocket({
    room,
    onMessage(evt) {
      const messageData = JSON.parse(evt.data) as FlowStateMessage;

      setNodes(messageData.nodes);
      setEdges(messageData.edges);
    },
  });

  // Executed when a new edge is created by the user
  const onConnect = useCallback(
    (params: Connection) => {
      socket.send(
        JSON.stringify({
          type: "edge",
          edges: addEdge(params, edges),
        } as StateChangeMessage)
      );
    },
    [setEdges, edges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      socket.send(
        JSON.stringify({
          type: "node",
          nodes: applyNodeChanges(changes, nodes),
        } as StateChangeMessage)
      );
    },
    [setNodes, nodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      socket.send(
        JSON.stringify({
          type: "edge",
          edges: applyEdgeChanges(changes, edges),
        } as StateChangeMessage)
      );
    },
    [setEdges, edges]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(<App />);

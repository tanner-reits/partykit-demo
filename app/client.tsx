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
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { v4 as uuid } from "uuid";

import "@xyflow/react/dist/style.css";
import { createRoot } from "react-dom/client";
import usePartySocket from "partysocket/react";
import type {
  FlowStateMessage,
  StateChangeMessage,
} from "../types/flow-state-message.type";
import Sidebar from "./components/sidebar";
import { DnDProvider, useDnD } from "./hooks/use-dnd";

import "./styles.css";

export default function App() {
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

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

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: uuid(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type]
  );

  return (
    <div className="dndflow">
      <div className="reactflow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Controls />
          <Background />
          <MiniMap />
        </ReactFlow>
      </div>
      <Sidebar />
    </div>
  );
}

export function Root() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <App />
      </DnDProvider>
    </ReactFlowProvider>
  );
}

createRoot(document.getElementById("app")!).render(<Root />);

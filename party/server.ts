import type { Edge, Node, NodeChange, NodePositionChange } from "@xyflow/react";
import type * as Party from "partykit/server";
import type {
  FlowStateMessage,
  StateChangeMessage,
} from "../types/flow-state-message.type";

const INITIAL_NODES: Node[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
  { id: "3", position: { x: 0, y: 200 }, data: { label: "3" } },
];

const INITIAL_EDGES: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

export default class Server implements Party.Server {
  nodes: Node[] = INITIAL_NODES;
  edges: Edge[] = INITIAL_EDGES;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // Send the current diagram state to the new client
    conn.send(
      JSON.stringify({
        nodes: this.nodes,
        edges: this.edges,
      } as FlowStateMessage)
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);

    const messageData = JSON.parse(message) as StateChangeMessage;

    if (messageData.type === "node") {
      this.nodes = messageData.nodes;
      this.broadcastState();
    }

    if (messageData.type === "edge") {
      this.edges = messageData.edges;
      this.broadcastState();
    }
  }

  broadcastState() {
    this.room.broadcast(
      JSON.stringify({
        nodes: this.nodes,
        edges: this.edges,
      } as FlowStateMessage),
      []
    );
  }
}

Server satisfies Party.Worker;

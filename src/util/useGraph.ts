import { useState } from "react";
import { Graph, NodeMap, WayMap, Node } from "./types";
const useGraph = () => {
    const [graph, setGraph] = useState<Graph | null>(null);

    function addEdge(nodeA: number, nodeB: number, graph: Graph) {
        if (!graph[nodeA]) {
            graph[nodeA] = [];
        }
        if (!graph[nodeB]) {
            graph[nodeB] = [];
        }
        graph[nodeA].push(nodeB);
        graph[nodeB].push(nodeA);
    }

    function buildGraph(ways: WayMap) {
        const graph: Graph = {};
        const waysEntries = Object.entries(ways);
        waysEntries.forEach((entry) => {
            const [, way] = entry;
            const nodeIds = way.nodes;
            if (nodeIds.length > 1) {
                addEdge(nodeIds[0], nodeIds[nodeIds.length - 1], graph);
            }
        });

        setGraph(graph);
        return graph;
    }

    function findConnectedMarkers(startNodeId: number, localGraph: Graph | null = graph): number[] {
        const visited: { [nodeId: number]: boolean } = {};
        const connectedMarkers: number[] = [];

        function dfs(nodeId: number) {
            if (!visited[nodeId]) {
                visited[nodeId] = true;
                connectedMarkers.push(nodeId);
                if (localGraph && localGraph[nodeId]) {
                    localGraph[nodeId].forEach((neighborNodeId) => {
                        dfs(neighborNodeId);
                    });
                }
            }
        }

        dfs(startNodeId);
        return connectedMarkers;
    }

    // function findPathBFS(
    //   graph: Graph,
    //   start: number,
    //   end: number,
    //   visitedEdges: Graph = {}
    // ): number[] | null {
    //   const queue: { node: number; path: number[] }[] = [];
    //   const visited: { [key: number]: boolean } = {};

    //   queue.push({ node: start, path: [start] });
    //   visited[start] = true;

    //   while (queue.length > 0) {
    //     const { node, path } = queue.shift()!;

    //     if (node === end) {
    //       return path;
    //     }

    //     const filteredNeighbors = graph[node].filter((neighbor) => {
    //       if (!visitedEdges[node]) {
    //         visitedEdges[node] = [];
    //       }
    //       if (!visitedEdges[neighbor]) {
    //         visitedEdges[neighbor] = [];
    //       }
    //       return !visitedEdges[node].includes(neighbor);
    //     });

    //     for (const neighbor of (filteredNeighbors.length === 0
    //       ? graph[node]
    //       : filteredNeighbors) || []) {
    //       if (!visited[neighbor]) {
    //         visited[neighbor] = true;
    //         queue.push({ node: neighbor, path: [...path, neighbor] });
    //       }
    //     }
    //   }

    //   return findPathBFS(graph, start, end, {});
    // }

    // interface Graph {
    //   [key: number]: { [key: number]: number };
    // }

    interface PriorityQueueItem {
        node: number;
        path: number[];
        cost: number;
    }

    class PriorityQueue {
        private elements: PriorityQueueItem[];
        private count: number;
        constructor() {
            this.count = 0;
            this.elements = [];
        }

        contains(node: number): boolean {
            return this.elements.some((element) => element.node === node);
        }

        getCost(node: number): number | null {
            const found = this.elements.find((element) => element.node === node);
            return found ? found.cost : null;
        }

        push(element: PriorityQueueItem): void {
            this.elements.push(element);
            this.count++;
            this.bubbleUp(this.elements.length - 1);
        }

        getCount(): number {
            return this.count;
        }

        pop(): PriorityQueueItem {
            if (this.isEmpty()) {
                throw new Error("PQ empty");
            }

            const first = this.elements[0];
            const end = this.elements.pop();

            if (this.elements.length > 0) {
                this.elements[0] = end as PriorityQueueItem;
                this.sinkDown(0);
            }

            return first;
        }

        isEmpty(): boolean {
            return this.elements.length === 0;
        }

        private bubbleUp(n: number): void {
            const element = this.elements[n];

            while (n > 0) {
                const parentN = Math.floor((n + 1) / 2) - 1;
                const parent = this.elements[parentN];

                if (element.cost >= parent.cost) {
                    break;
                }

                this.elements[parentN] = element;
                this.elements[n] = parent;
                n = parentN;
            }
        }

        private sinkDown(n: number): void {
            const length = this.elements.length;
            const element = this.elements[n];

            while (true) {
                let swap = null;
                const rightN = (n + 1) * 2;
                const leftN = rightN - 1;

                if (leftN < length) {
                    const left = this.elements[leftN];
                    if (left.cost < element.cost) {
                        swap = leftN;
                    }
                }

                if (rightN < length) {
                    const right = this.elements[rightN];
                    if (right.cost < (swap === null ? element.cost : this.elements[leftN].cost)) {
                        swap = rightN;
                    }
                }

                if (swap === null) break;

                this.elements[n] = this.elements[swap];
                this.elements[swap] = element;
                n = swap;
            }
        }
    }

    function findPathAstar(
        graph: Graph,
        start: number,
        end: number,
        visitedNodes: number[],
        nodes: NodeMap,
    ): number[] | null {
        console.log(start, end);
        const openSet = new PriorityQueue();
        openSet.push({ node: start, path: [start], cost: 0 });

        const closedSet: Set<number> = new Set();
        while (!openSet.isEmpty()) {
            const current = openSet.pop();

            if (current.node === end) {
                console.log(`currPath: ${current.path}`);
                console.log(`openSet count: ${openSet.getCount()}`);
                return current.path;
            }
            closedSet.add(current.node);
            for (const neighbor of graph[current.node] || []) {
                if (!closedSet.has(neighbor)) {
                    const newPath = [...current.path, neighbor];
                    const heuCost = heuristic(current.node, end, nodes);
                    const newCost =
                        current.cost +
                        heuCost +
                        (visitedNodes.includes(neighbor) ? heuCost * 10 : 1);

                    if (
                        !openSet.contains(neighbor) ||
                        newCost < (openSet.getCost(neighbor) || Infinity)
                    ) {
                        openSet.push({ node: neighbor, path: newPath, cost: newCost });
                    }
                }
            }
        }

        return null;
    }

    function heuristic(node: number, goal: number, nodes: NodeMap): number {
        const nodeCoords = nodes[node];
        const goalCoords = nodes[goal];

        return distance(nodeCoords, goalCoords);
    }

    function distance(nodeCoords: Node, goalCoords: Node) {
        const lat1 = nodeCoords.lat;
        const lon1 = nodeCoords.lon;
        const lat2 = goalCoords.lat;
        const lon2 = goalCoords.lon;
        const R = 6371e3;
        const r1 = (lat1 * Math.PI) / 180;
        const r2 = (lat2 * Math.PI) / 180;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLong = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(r1) * Math.cos(r2) * Math.sin(dLong / 2) * Math.sin(dLong / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // in metres
    }

    return { graph, buildGraph, findConnectedMarkers, findPathAstar };
};

export default useGraph;

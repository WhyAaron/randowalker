import { useState } from "react";
import { Graph, WayMap } from "./types";
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

  function findConnectedMarkers(
    startNodeId: number,
    localGraph: Graph | null = graph
  ): number[] {
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

  function findPathBFS(
    graph: Graph,
    start: number,
    end: number,
    visitedEdges: Graph = {}
  ): number[] | null {
    const queue: { node: number; path: number[] }[] = [];
    const visited: { [key: number]: boolean } = {};

    queue.push({ node: start, path: [start] });
    visited[start] = true;

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === end) {
        return path;
      }

      const filteredNeighbors = graph[node].filter((neighbor) => {
        if (!visitedEdges[node]) {
          visitedEdges[node] = [];
        }
        if (!visitedEdges[neighbor]) {
          visitedEdges[neighbor] = [];
        }
        return !visitedEdges[node].includes(neighbor);
      });

      for (const neighbor of (filteredNeighbors.length === 0
        ? graph[node]
        : filteredNeighbors) || []) {
        if (!visited[neighbor]) {
          visited[neighbor] = true;
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return findPathBFS(graph, start, end, {});
  }

  return { graph, buildGraph, findConnectedMarkers, findPathBFS };
};

export default useGraph;

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import {
    extractNodesAndWays,
    extractSegmentsAndPoints,
} from "./util/parser.ts";
import { Graph, Node, NodeMap } from "./util/types.ts";
import * as turf from "@turf/turf";
import { Feature, FeatureCollection, Point } from "geojson";
import { useState, useMemo } from "react";
import AreaMarker from "./components/AreaMarker.tsx";
import useFetch from "./util/useFetch.ts";
import Segments from "./components/Segments.tsx";
import Nodes from "./components/Nodes.tsx";
import useGraph from "./util/useGraph.ts";
import ConnectedNodes from "./components/ConnectedNodes.tsx";
import FullPath from "./components/FullPath.tsx";
import Controls from "./components/Controls.tsx";
import { useSelector } from "react-redux";
import { RootState } from "./util/store/store.ts";

function App() {
    console.log("render");

    const [connectedNodes, setConnectedNodes] = useState<number[] | null>(null);
    const [selectedPointsFull, setSelectedPointsFull] = useState<number[][]>(
        []
    );
    const controlState = useSelector(
        (state: RootState) => state.controls.controlState
    );
    const areaPosition = useSelector((state: RootState) => state.mapData.areaPosition)
    const startNode = useSelector((state: RootState) => state.mapData.startNode);
    const areaRadius = useSelector((state: RootState) => state.mapData.areaRadius);
    const { data, error } = useFetch(
        areaPosition,
        areaRadius,
        controlState
    );
    const { graph, buildGraph, findConnectedMarkers, findPathAstar } =
        useGraph();

    const { nodes, ways } = useMemo(() => extractNodesAndWays(data), [data]);
    const { segments } = useMemo(() => extractSegmentsAndPoints(ways), [ways]);
    const centerOfMass = useMemo(
        () => getCenterOfMass(connectedNodes, nodes),
        [connectedNodes, nodes]
    );
    const quadrants = useMemo(() => generateQuadrants(), [connectedNodes]);

    //
    const [selectedPoints, setSelectedPoints] = useState<number[][]>([]);
    function getCenterOfMass(
        nodes: number[] | null,
        nodeMap: NodeMap
    ): Feature<Point> | null {
        if (nodes === null || nodeMap === null) return null;
        const nodeCollection: FeatureCollection<Point> = turf.featureCollection(
            nodes.map((node) =>
                turf.point([nodeMap[node].lon, nodeMap[node].lat])
            )
        );
        return turf.centerOfMass(nodeCollection);
    }

    function generateMainPathPoints(): number[][] {
        if (!centerOfMass) return [];

        const mainPathPoints: number[][] = [
            getRandomPointFromQuadrant(quadrants.topLeft),
            getRandomPointFromQuadrant(quadrants.topRight),
            getRandomPointFromQuadrant(quadrants.bottomRight),
            getRandomPointFromQuadrant(quadrants.bottomLeft),
        ];

        if (startNode && connectedNodes) {
            const nodePosition = determineNodePosition(
                nodes[startNode],
                centerOfMass
            );

            switch (nodePosition) {
                case "topLeft":
                    mainPathPoints[0] = getNodeCoordinates(startNode);
                    break;
                case "topRight":
                    mainPathPoints[1] = getNodeCoordinates(startNode);
                    break;
                case "bottomLeft":
                    mainPathPoints[3] = getNodeCoordinates(startNode);
                    break;
                case "bottomRight":
                    mainPathPoints[2] = getNodeCoordinates(startNode);
                    break;
            }
        }

        mainPathPoints.push(mainPathPoints[0]);

        return mainPathPoints;
    }

    function determineNodePosition(node: Node, center: Feature<Point>): string {
        const isTop = node.lat < center.geometry.coordinates[1];
        const isLeft = node.lon < center.geometry.coordinates[0];

        return isTop
            ? isLeft
                ? "topLeft"
                : "topRight"
            : isLeft
                ? "bottomLeft"
                : "bottomRight";
    }

    function getNodeCoordinates(nodeId: number): number[] {
        return [nodes[nodeId].lat, nodes[nodeId].lon, Number(nodeId)];
    }

    function generateRandomPath(): number[][] {
        const mainPathPoints = selectedPoints;
        const visitedEdges: Graph = {};
        const pathPoints: number[][] = [];
        const visitedNodes: number[] = [];
        mainPathPoints.forEach((point, index) => {
            if (mainPathPoints[index + 1] && graph) {
                const path = findPathAstar(
                    graph,
                    point[2],
                    mainPathPoints[index + 1][2],
                    visitedNodes,
                    nodes
                );
                if (path) {
                    path.forEach((nodeId, index) => {
                        visitedNodes.push(nodeId);
                        pathPoints.push([
                            nodes[nodeId].lat,
                            nodes[nodeId].lon,
                            nodeId,
                        ]);
                        if (index !== 0) {
                            if (!visitedEdges[nodeId]) {
                                visitedEdges[nodeId] = [];
                            }
                            if (!visitedEdges[path[index - 1]]) {
                                visitedEdges[path[index - 1]] = [];
                            }
                            visitedEdges[nodeId].push(path[index - 1]);
                            visitedEdges[path[index - 1]].push(nodeId);
                        }
                    });
                }
            }
        });

        return pathPoints;
    }

    function generateQuadrants(): Record<string, number[][]> {
        const quadrants: Record<string, number[][]> = {
            topLeft: [],
            topRight: [],
            bottomLeft: [],
            bottomRight: [],
        };

        if (connectedNodes === null || centerOfMass === null) return quadrants;

        connectedNodes.forEach((nodeId) => {
            const nodePosition = determineNodePosition(
                nodes[nodeId],
                centerOfMass
            );

            switch (nodePosition) {
                case "topLeft":
                    quadrants.topLeft.push(getNodeCoordinates(nodeId));
                    break;
                case "topRight":
                    quadrants.topRight.push(getNodeCoordinates(nodeId));
                    break;
                case "bottomLeft":
                    quadrants.bottomLeft.push(getNodeCoordinates(nodeId));
                    break;
                case "bottomRight":
                    quadrants.bottomRight.push(getNodeCoordinates(nodeId));
                    break;
            }
        });

        return quadrants;
    }

    function getRandomPointFromQuadrant(quadrant: number[][]): number[] {
        if (quadrant.length === 0) return [];
        const randomIndex = Math.floor(Math.random() * quadrant.length);
        return quadrant[randomIndex];
    }

    return (
        <div className="w-full h-full grid grid-cols-5">
            {error && (
                <div className="absolute top-1/2 right-1/2 bg-slate-100 h-1/4 w-1/4 z-10 rounded-md -translate-y-1/2 translate-x-1/2 flex flex-col justify-center items-center">
                    <h2 className=" text-2xl">Error</h2>
                    <p>{error.message}</p>
                </div>
            )}
            <div className="col-span-1 bg-zinc-200 p-2 grid grid-rows-10">
                <div className="flex flex-col justify-center items-center row-span-1">
                    <h1 className=" font-extrabold text-4xl">LOGO</h1>
                    <p>Randomize your daily steps</p>
                </div>
                <Controls
                    buildGraph={buildGraph}
                    setConnectedNodes={setConnectedNodes}
                    findConnectedMarkers={findConnectedMarkers}
                    segments={segments}
                    setSelectedPoints={setSelectedPoints}
                    generateMainPathPoints={generateMainPathPoints}
                    setSelectedPointsFull={setSelectedPointsFull}
                    generateRandomPath={generateRandomPath}
                />

                <div className="flex flex-1 items-center justify-center row-span-1">
                    Footer
                </div>
            </div>
            <div className="w-full h-full col-span-4 z-0">
                <MapContainer
                    center={[49.388938, 11.3694008]}
                    zoom={8}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FullPath
                        points={nodes}
                        selectedNodes={selectedPointsFull}
                    />
                    <AreaMarker
                        startingPosition={null}
                        active={controlState === "areaSelection"}
                    />
                    {<Segments segments={segments} points={nodes} />}
                    {!graph && (
                        <Nodes
                            segments={segments}
                            nodes={nodes}
                        />
                    )}
                    <ConnectedNodes
                        nodes={nodes}
                        connectedNodes={connectedNodes}
                    />
                </MapContainer>
            </div>
        </div>
    );
}

export default App;

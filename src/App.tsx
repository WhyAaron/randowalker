import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import {
    extractNodesAndWays,
    extractSegmentsAndPoints,
} from "./util/parser.ts";
import { LatLng, LatLngTuple } from "leaflet";
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

function App() {
    console.log("render");
    const [appState, setAppState] = useState<
        "areaSelection" | "startSelection" | "pathSelection"
    >("areaSelection");
    const [startingPosition, setStartingPosition] =
        useState<LatLngTuple | null>(null);
    const [startingNode, setStartingNode] = useState<number | null>(null);
    const [connectedNodes, setConnectedNodes] = useState<number[] | null>(null);
    const [areaRadius, setAreaRadius] = useState<number>(1000);
    const [selectedPointsFull, setSelectedPointsFull] = useState<number[][]>(
        []
    );

    const { data, error } = useFetch(startingPosition, areaRadius, appState);
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

        if (startingNode && connectedNodes) {
            const nodePosition = determineNodePosition(
                nodes[startingNode],
                centerOfMass
            );

            switch (nodePosition) {
                case "topLeft":
                    mainPathPoints[0] = getNodeCoordinates(startingNode);
                    break;
                case "topRight":
                    mainPathPoints[1] = getNodeCoordinates(startingNode);
                    break;
                case "bottomLeft":
                    mainPathPoints[3] = getNodeCoordinates(startingNode);
                    break;
                case "bottomRight":
                    mainPathPoints[2] = getNodeCoordinates(startingNode);
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

    const updateStartingPosition = (position: LatLng) => {
        setStartingPosition([position.lat, position.lng]);
    };

    const updateStartingNode = (nodeId: number) => {
        setStartingNode(nodeId);
    };

    const changeAreaRadius = (e: any) => {
        setAreaRadius(e.target.value);
    };

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
                <div className="flex flex-col items-center justify-center row-span-8">
                    {appState === "areaSelection" && (
                        <>
                            <label
                                htmlFor="default-range"
                                className="block mb-2 text-sm font-medium text-gray-900"
                            >
                                Area Radius
                            </label>
                            <input
                                id="default-range"
                                type="range"
                                min={500}
                                max={2000}
                                defaultValue={1000}
                                onChange={changeAreaRadius}
                                step="10"
                                className=" w-9/12 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                            <button
                                className="bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded m-4"
                                onClick={() => {
                                    if (startingPosition === null) return;
                                    setAppState("startSelection");
                                }}
                            >
                                Load paths
                            </button>
                        </>
                    )}
                    {appState === "startSelection" && (
                        <>
                            <div>
                                <input
                                    type="checkbox"
                                    id="startingNode"
                                    name="startingNode"
                                    checked={startingNode !== null}
                                    disabled
                                />
                                <label className="ml-2" htmlFor="startingNode">
                                    Select a starting node
                                </label>
                            </div>
                            <button
                                className="bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded m-4"
                                disabled={startingNode === null}
                                onClick={() => {
                                    if (startingNode === null) return;
                                    const newGraph = buildGraph(segments);
                                    setConnectedNodes(
                                        findConnectedMarkers(
                                            startingNode,
                                            newGraph
                                        )
                                    );
                                    setAppState("pathSelection");
                                }}
                            >
                                build graph
                            </button>
                        </>
                    )}
                    {appState === "pathSelection" && (
                        <>
                            <button
                                className="bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded m-4"
                                onClick={() => {
                                    setSelectedPoints(generateMainPathPoints());
                                }}
                            >
                                Generate path
                            </button>
                            <button
                                className="bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded m-4"
                                onClick={() => {
                                    setSelectedPointsFull(generateRandomPath());
                                }}
                            >
                                Show path
                            </button>
                        </>
                    )}
                </div>
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
                        radius={areaRadius}
                        setStartingPosition={updateStartingPosition}
                        active={appState === "areaSelection"}
                    />
                    {<Segments segments={segments} points={nodes} />}
                    {!graph && (
                        <Nodes
                            segments={segments}
                            nodes={nodes}
                            setStartingNode={updateStartingNode}
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

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { Graph } from "./util/types.ts";
import AreaMarker from "./components/AreaMarker.tsx";
import Segments from "./components/Segments.tsx";
import Nodes from "./components/Nodes.tsx";
import useGraph from "./util/useGraph.ts";
import ConnectedNodes from "./components/ConnectedNodes.tsx";
import FullPath from "./components/FullPath.tsx";
import Controls from "./components/Controls.tsx";
import { useSelector } from "react-redux";
import { RootState } from "./util/store/store.ts";

function App() {
    const controlState = useSelector((state: RootState) => state.controls.controlState);
    const nodes = useSelector((state: RootState) => state.mapData.nodes);
    const segments = useSelector((state: RootState) => state.mapData.segments);
    const connectedNodes = useSelector((state: RootState) => state.mapData.connectedNodes)
    const fullPath = useSelector((state: RootState) => state.mapData.fullPath);

    const { graph, buildGraph, findConnectedMarkers, findPathAstar } = useGraph();

    function generateRandomPath(selectedPoints: number[][]): number[][] {
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
                    nodes,
                );
                if (path) {
                    path.forEach((nodeId, index) => {
                        visitedNodes.push(nodeId);
                        pathPoints.push([nodes[nodeId].lat, nodes[nodeId].lon, nodeId]);
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

    return (
        <div className="w-full h-full grid grid-cols-5">
            {/* {error && (
                <div className="absolute top-1/2 right-1/2 bg-slate-100 h-1/4 w-1/4 z-10 rounded-md -translate-y-1/2 translate-x-1/2 flex flex-col justify-center items-center">
                    <h2 className=" text-2xl">Error</h2>
                    <p>{error.message}</p>
                </div>
            )} */}
            <div className="col-span-1 bg-zinc-200 p-2 grid grid-rows-10">
                <div className="flex flex-col justify-center items-center row-span-1">
                    <h1 className=" font-extrabold text-4xl">LOGO</h1>
                    <p>Randomize your daily steps</p>
                </div>
                <Controls
                    buildGraph={buildGraph}
                    findConnectedMarkers={findConnectedMarkers}
                    generateRandomPath={generateRandomPath}
                />

                <div className="flex flex-1 items-center justify-center row-span-1">Footer</div>
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
                    <FullPath points={nodes} fullPath={fullPath} />
                    <AreaMarker startingPosition={null} active={controlState === "areaSelection"} />
                    {<Segments segments={segments} points={nodes} />}
                    {!graph && <Nodes segments={segments} nodes={nodes} />}
                    <ConnectedNodes nodes={nodes} connectedNodes={connectedNodes} />
                </MapContainer>
            </div>
        </div>
    );
}

export default App;

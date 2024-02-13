import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "../util/store/store";
import { useDispatch } from "react-redux";
import { setAreaRadius, fetchData, setConnectedNodes, recalculateMapFeatures, setSelectedPoints, setCompletedPathSegments, createCompletePath } from "../util/store/mapDataSlice";
import { setPathSelection, setStartSelection } from "../util/store/controlSlice";
import { generateMainPathPoints } from "../util/helpers";

interface ControlsProps {
    buildGraph: (segments: any) => any;
    findConnectedMarkers: (node: number, graph: any) => number[];
    generateRandomPath: (selectedPoints: number[][]) => any;
}

export default function Controls({
    buildGraph,
    findConnectedMarkers,
    generateRandomPath,
}: ControlsProps) {
    const controlState = useSelector((state: RootState) => state.controls.controlState);

    const stateComponents = {
        areaSelection: <AreaSelection />,
        startSelection: (
            <StartSelection
                buildGraph={buildGraph}
                findConnectedMarkers={findConnectedMarkers}
            />
        ),
        pathSelection: (
            <PathSelection
                generateRandomPath={generateRandomPath}
            />
        ),
    };

    return (
        <div className="flex flex-col items-center justify-center row-span-8">
            {stateComponents[controlState] || <p>controlState error</p>}
        </div>
    );
}

function AreaSelection() {
    const areaRadius = useSelector((state: RootState) => state.mapData.areaRadius);
    const areaPosition = useSelector((state: RootState) => state.mapData.areaPosition);
    const dispatch = useDispatch<AppDispatch>();

    return (
        <>
            <label htmlFor="default-range" className="block mb-2 text-sm font-medium text-gray-900">
                Area Radius
            </label>
            <input
                id="default-range"
                type="range"
                min={500}
                max={2000}
                defaultValue={1000}
                onChange={(value) => dispatch(setAreaRadius(parseInt(value.target.value)))}
                step="10"
                className=" w-9/12 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <button
                className="bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded m-4"
                onClick={() => {
                    if (areaPosition === null) return;
                    dispatch(fetchData());
                    dispatch(setStartSelection());
                }}
            >
                Load paths {areaRadius}
            </button>
        </>
    );
}

interface StartSelectionProps {
    buildGraph: (segments: any) => any;
    findConnectedMarkers: (node: number, graph: any) => number[];
}

function StartSelection({
    buildGraph,
    findConnectedMarkers,
}: StartSelectionProps) {
    const startingNode = useSelector((state: RootState) => state.mapData.startNode);
    const segments = useSelector((state: RootState) => state.mapData.segments);
    const dispatch = useDispatch<AppDispatch>();

    return (
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
                    dispatch(setConnectedNodes(findConnectedMarkers(startingNode, newGraph)))
                    dispatch(recalculateMapFeatures());
                    dispatch(setPathSelection());
                }}
            >
                build graph
            </button>
        </>
    );
}

interface PathSelectionProps {
    generateRandomPath: (selectedPoints: number[][]) => any;
}

function PathSelection({
    generateRandomPath,
}: PathSelectionProps) {
    const centerOfMass = useSelector((state: RootState) => state.mapData.centerOfMass);
    const quadrants = useSelector((state: RootState) => state.mapData.quadrants);
    const nodes = useSelector((state: RootState) => state.mapData.nodes);
    const startNode = useSelector((state: RootState) => state.mapData.startNode);
    const connectedNodes = useSelector((state: RootState) => state.mapData.connectedNodes);
    const dispatch = useDispatch<AppDispatch>();
    return (
        <>
            <button
                className="bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded m-4"
                onClick={() => {
                    const selectedPoints = generateMainPathPoints(centerOfMass, quadrants, nodes, startNode, connectedNodes);
                    dispatch(setSelectedPoints(selectedPoints));
                    dispatch(setCompletedPathSegments(generateRandomPath(selectedPoints)));
                    dispatch(createCompletePath());
                }}
            >
                Generate path
            </button>
        </>
    );
}

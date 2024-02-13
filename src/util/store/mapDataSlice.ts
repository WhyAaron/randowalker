import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LatLngTuple } from "leaflet";
import { AppDispatch, RootState } from "./store";
import { WayMap, NodeMap } from "../types";
import { Feature, Point, GeoJsonProperties } from "geojson";
import { extractNodesAndWays, extractSegmentsAndPoints } from "../parser";
import { getCenterOfMass, generateQuadrants } from "../helpers";
import * as turf from "@turf/turf";

export const fetchData = createAsyncThunk("mapData/fetchData", async (_, { getState }) => {
    const position = (getState() as RootState).mapData.areaPosition;
    const radius = (getState() as RootState).mapData.areaRadius;
    const overpassUrl = "https://overpass-api.de/api/interpreter";

    if (!position) return;

    const fetchOptions = {
        method: "POST",
        body: `
            <osm-script output="json">
                <query type="way">
                    <around lat="${position[0]}" lon="${position[1]}" radius="${radius || 1000}"/>
                    <has-kv k="highway" regv="path|track|unclassified"/>
                </query>
                <union>
                    <item/>
                    <recurse type="down"/>
                </union>
                <print mode="body"/>
            </osm-script>
            `,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };

    const response = await fetch(overpassUrl, fetchOptions);
    const data = await response.json();
    return data;
});

export const recalculateMapFeatures = () => (dispatch: AppDispatch, getState: () => RootState) => {
    const { nodes, connectedNodes } = getState().mapData;
    if (!nodes || connectedNodes.length === 0) return;

    const centerOfMass = getCenterOfMass(connectedNodes, nodes);
    dispatch(setCenterOfMass(centerOfMass));

    const quadrants = generateQuadrants(connectedNodes, nodes, centerOfMass);
    dispatch(setQuadrants(quadrants));
};

export const createCompletePath = () => (dispatch: AppDispatch, getState: () => RootState) => {
    const fullPath = getState().mapData.completedPathSegments;
    const nodes = getState().mapData.nodes;
    if (fullPath) {
        const completePath: number[][] = [];
        fullPath.forEach((nodeIds, index) => {
            if (index === fullPath.length - 1) return null;
            const start = nodeIds[2];
            const end = fullPath[index + 1] ? fullPath[index + 1][2] : fullPath[0][2];
            completePath.push([nodes[start].lat, nodes[start].lon]);
            completePath.push([nodes[end].lat, nodes[end].lon]);
        });
        if (completePath.length > 0) {
            const line = turf.lineString(completePath);
            const length = turf.length(line, { units: "kilometers" });
            dispatch(setLength(length));
            dispatch(setCompletedPath(completePath));
        }
    }
};

export interface MapDataState {
    areaPosition: LatLngTuple | null;
    areaRadius: number;
    startNode: number | null;
    nodes: NodeMap;
    ways: WayMap;
    segments: WayMap;
    centerOfMass: Feature<Point, GeoJsonProperties> | null;
    quadrants: Record<string, number[][]>;
    connectedNodes: number[];
    selectedPoints: number[][];
    completedPathSegments: number[][];
    completedPath: number[][];
    length: number | null;
}

const initialState: MapDataState = {
    areaPosition: null,
    areaRadius: 1000,
    startNode: null,
    nodes: {},
    ways: {},
    segments: {},
    centerOfMass: null,
    quadrants: {},
    connectedNodes: [],
    selectedPoints: [],
    completedPathSegments: [],
    completedPath: [],
    length: null,
};

export const mapDataSlice = createSlice({
    name: "mapData",
    initialState,
    reducers: {
        setAreaPosition: (state, action: PayloadAction<LatLngTuple>) => {
            state.areaPosition = action.payload;
        },
        setAreaRadius: (state, action: PayloadAction<number>) => {
            state.areaRadius = action.payload;
        },
        setStartNode: (state, action: PayloadAction<number>) => {
            state.startNode = action.payload;
        },
        setConnectedNodes: (state, action: PayloadAction<number[]>) => {
            state.connectedNodes = action.payload;
        },
        setCenterOfMass: (
            state,
            action: PayloadAction<Feature<Point, GeoJsonProperties> | null>,
        ) => {
            state.centerOfMass = action.payload;
        },
        setQuadrants: (state, action: PayloadAction<Record<string, number[][]>>) => {
            state.quadrants = action.payload;
        },
        setSelectedPoints: (state, action: PayloadAction<number[][]>) => {
            state.selectedPoints = action.payload;
        },
        setCompletedPathSegments: (state, action: PayloadAction<number[][]>) => {
            state.completedPathSegments = action.payload;
        },
        setLength: (state, action: PayloadAction<number>) => {
            state.length = action.payload;
        },
        setCompletedPath: (state, action: PayloadAction<number[][]>) => {
            state.completedPath = action.payload;
        },
    },
    extraReducers(builder) {
        builder.addCase(fetchData.fulfilled, (state, action) => {
            const { nodes, ways } = extractNodesAndWays(action.payload);
            state.nodes = nodes;
            state.ways = ways;
            state.segments = extractSegmentsAndPoints(ways).segments;
            console.log("fulfilled");
            console.log(nodes, ways);
        });
    },
});

export const {
    setAreaPosition,
    setAreaRadius,
    setStartNode,
    setConnectedNodes,
    setCenterOfMass,
    setQuadrants,
    setSelectedPoints,
    setCompletedPathSegments,
    setLength,
    setCompletedPath,
} = mapDataSlice.actions;

export default mapDataSlice.reducer;

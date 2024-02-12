import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LatLngTuple } from "leaflet";
import { AppDispatch, RootState } from "./store";
import { WayMap, NodeMap } from "../types";
import { Feature, Point, GeoJsonProperties } from "geojson";
import { extractNodesAndWays, extractSegmentsAndPoints } from "../parser";
import { getCenterOfMass, generateQuadrants } from "../helpers";

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
} = mapDataSlice.actions;

export default mapDataSlice.reducer;

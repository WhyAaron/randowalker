import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LatLngTuple } from "leaflet";

export interface MapDataState {
    areaPosition: LatLngTuple | null,
    areaRadius: number,
    startNode: number | null,
}
const initialState: MapDataState = {
    areaPosition: null,
    areaRadius: 1000,
    startNode: null,
}

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
        }
    }
})

export const { setAreaPosition, setAreaRadius, setStartNode } = mapDataSlice.actions;

export default mapDataSlice.reducer;
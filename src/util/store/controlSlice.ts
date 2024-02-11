import { createSlice } from "@reduxjs/toolkit";

export interface ControlsState {
    controlState: 'areaSelection' | 'startSelection' | 'pathSelection',
}
const initialState: ControlsState = {
    controlState: 'areaSelection'
}

export const controlsSlice = createSlice({
    name: "controls",
    initialState,
    reducers: {
        setAreaSelection: (state) => {
            state.controlState = 'areaSelection'
        },
        setStartSelection: (state) => {
            state.controlState = 'startSelection'
        },
        setPathSelection: (state) => {
            state.controlState = 'pathSelection'
        },
    }
})

export const { setAreaSelection, setStartSelection, setPathSelection } = controlsSlice.actions;

export default controlsSlice.reducer;
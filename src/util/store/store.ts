import { configureStore } from "@reduxjs/toolkit";
import controlsReducer from "./controlSlice";
import mapDataReducer from "./mapDataSlice";

const store = configureStore({
    reducer: {
        controls: controlsReducer,
        mapData: mapDataReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

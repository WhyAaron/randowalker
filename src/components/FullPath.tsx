import React from "react";
import { Polyline } from "react-leaflet";
import { useSelector } from "react-redux";
import { RootState } from "../util/store/store";
import { LatLngTuple } from "leaflet";


const FullPath: React.FC = () => {
    const completedPath = useSelector((state: RootState) => state.mapData.completedPath);
    if (completedPath.length === 0) return null;
    return (
        <Polyline
            positions={completedPath as LatLngTuple[]}
            pathOptions={{ color: "#18181b", weight: 10 }}
        />
    );
};

export default FullPath;

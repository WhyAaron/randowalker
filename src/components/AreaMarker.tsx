import React, { useState } from "react";
import { Circle, useMapEvents } from "react-leaflet";
import { LatLng } from "leaflet";
import { useDispatch } from "react-redux";
import { setAreaPosition } from "../util/store/mapDataSlice";
import { AppDispatch, RootState } from "../util/store/store";
import { useSelector } from "react-redux";
interface AreaMarkerProps {
    startingPosition: LatLng | null;
    active: boolean;
}

const AreaMarker: React.FC<AreaMarkerProps> = ({
    startingPosition,
    active,
}) => {
    const [position, setPosition] = useState<LatLng | null>(startingPosition);
    const dispatch = useDispatch<AppDispatch>();
    const areaRadius = useSelector(
        (state: RootState) => state.mapData.areaRadius
    );

    useMapEvents({
        click(e) {
            if (active) {
                setPosition(e.latlng);
                //setStartingPosition(e.latlng);
                dispatch(setAreaPosition([e.latlng.lat, e.latlng.lng]));
            }
        },
    });

    return position === null ? null : (
        <Circle center={position} radius={areaRadius} />
    );
};

export default AreaMarker;

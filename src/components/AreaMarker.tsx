import React, { useState } from "react"
import { Circle, useMapEvents } from "react-leaflet"
import { LatLng } from "leaflet";

interface AreaMarkerProps {
  startingPosition: LatLng | null;
  radius: number;
  setStartingPosition: (position: LatLng) => void;
  active: boolean;
}

const AreaMarker: React.FC<AreaMarkerProps> = ({ startingPosition, radius = 500, setStartingPosition, active }) => {
  const [position, setPosition] = useState<LatLng | null>(startingPosition)
  
  useMapEvents({
    click(e) {
      if(active){
        setPosition(e.latlng)
        setStartingPosition(e.latlng)
      };
    },
  })

  return position === null ? null : (
    <Circle center={position} radius={radius} />
  )
}

export default AreaMarker
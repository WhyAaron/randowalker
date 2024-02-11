import React from "react";
import { Polyline } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { WayMap, NodeMap, IPolyline } from "../util/types";

interface SegmentsProps {
    segments: WayMap;
    points: NodeMap;
}

const Segments: React.FC<SegmentsProps> = ({ segments, points }) => {
    const segmentsEntries = Object.entries(segments);
    const polylines: IPolyline[] = segmentsEntries.map((entry) => {
        const [id, way] = entry;
        const nodeIds = way.nodes;
        const nodesArr = nodeIds.map(
            (nodeId) => [points[nodeId].lat, points[nodeId].lon] as LatLngExpression,
        );
        return { id, nodes: nodesArr };
    });

    return (
        <>
            {polylines.map((polyline, index) => {
                const hue = (index * 300) % 360;
                const saturation = 20;
                const lightness = 50;
                const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                return (
                    <Polyline
                        key={polyline.id}
                        positions={polyline.nodes}
                        pathOptions={{ color: color }}
                    />
                );
            })}
        </>
    );
};

export default Segments;

import React from "react";
import { Circle } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { NodeMap } from "../util/types";

interface NodesProps {
    nodes: NodeMap;
    connectedNodes: number[] | null;
}

const ConnectedNodes: React.FC<NodesProps> = ({ nodes, connectedNodes }) => {
    const segmentNodes: { [key: string]: LatLngExpression } = {};

    if (connectedNodes === null) return <></>;
    connectedNodes.forEach((nodeID) => {
        segmentNodes[nodeID] = [nodes[nodeID].lat, nodes[nodeID].lon];
    });

    const handleCircleClick = (nodeId: string, latLng: LatLngExpression) => {
        console.log(`Circle clicked: ${nodeId}, ${latLng}`);
    };

    return (
        <>
            {Object.entries(segmentNodes).map(([nodeId, latLng]) => (
                <Circle
                    data-segment-id={nodeId}
                    key={`${nodeId}`}
                    center={latLng}
                    radius={10}
                    pathOptions={{ color: "#18181b" }}
                    eventHandlers={{
                        click: () => handleCircleClick(nodeId, latLng),
                    }}
                />
            ))}
        </>
    );
};

export default ConnectedNodes;

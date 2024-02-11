import React, { useState } from "react";
import { Circle } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { WayMap, NodeMap } from "../util/types";
import { AppDispatch } from "../util/store/store";
import { useDispatch } from "react-redux";
import { setStartNode } from "../util/store/mapDataSlice";

interface NodesProps {
    segments: WayMap;
    nodes: NodeMap;
}

const Nodes: React.FC<NodesProps> = ({ segments, nodes }) => {
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const dispatch = useDispatch<AppDispatch>();

    const segmentsEntries = Object.entries(segments);

    const segmentNodes: { [key: string]: LatLngExpression } = {};

    segmentsEntries.forEach(([, segment]) => {
        const startNode = nodes[segment.nodes[0]];
        const endNode = nodes[segment.nodes[segment.nodes.length - 1]];
        segmentNodes[segment.nodes[0]] = [startNode.lat, startNode.lon];
        segmentNodes[segment.nodes[segment.nodes.length - 1]] = [
            endNode.lat,
            endNode.lon,
        ];
    });

    const eventHandler = {
        click: (e: any) => {
            setActiveNode(e.target.options["data-segment-id"]);
            //setStartingNode(e.target.options["data-segment-id"]);
            dispatch(setStartNode(e.target.options["data-segment-id"]));
        },
    };

    return (
        <>
            {Object.entries(segmentNodes).map(([nodeId, latLng]) => (
                <Circle
                    data-segment-id={nodeId}
                    key={nodeId}
                    center={latLng}
                    radius={10}
                    pathOptions={
                        activeNode === nodeId ? { color: "green" } : { color: "red" }
                    }
                    eventHandlers={eventHandler}
                />
            ))}
        </>
    );
};

export default Nodes;

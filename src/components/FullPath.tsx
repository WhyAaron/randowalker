import React from "react";
import { Polyline } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { WayMap, NodeMap, IPolyline } from "../util/types";
import { random } from "@turf/turf";

interface FullPathProps {
    points: NodeMap;
    selectedNodes: number[][] | null;
}

const FullPath: React.FC<FullPathProps> = ({ points, selectedNodes }) => {
    console.log("selectedNodes", selectedNodes);
    console.log("points", points);
    // if (selectedNodes === null) return <></>;
    // console.log("selectedNodes", selectedNodes);
    // const segmentsEntries = Object.entries(segments);
    // const polylines: IPolyline[] = selectedNodes.map((nodeIds, index) => {
    //   if (nodeIds[2] === 459970641) {
    //     console.log("nodeIds", nodeIds);
    //   }
    //   const start = nodeIds[2];
    //   const end = selectedNodes[index + 1]
    //     ? selectedNodes[index + 1][2]
    //     : selectedNodes[0][2];
    //   let path: IPolyline | undefined;
    //   console.log("segmentsEntries", segmentsEntries);
    //   segmentsEntries.forEach((entry) => {
    //     const [, way] = entry;
    //     if (way.nodes.includes(start) && way.nodes.includes(end)) {
    //       const nodesArr = way.nodes.map((nodeId) => {
    //         if (points[nodeId].lon === 10.947908) {
    //           console.log("nodeId", nodeId);
    //         }
    //         return [points[nodeId].lat, points[nodeId].lon] as LatLngExpression;
    //       });
    //       path = { id: `id-${index}`, nodes: nodesArr } as IPolyline;
    //     }
    //   });
    //   return path || { id: "0", nodes: [] };
    // });

    const generateRandomHexColor = () => {
        const hex = Math.floor(Math.random() * 0xffffff);
        return "#" + hex.toString(16).padStart(6, "0");
    };

    return (
        <>
            {/* {polylines.map((polyline, index) => {
        const randomColor = generateRandomHexColor();
        return (
          <Polyline
            key={polyline.id}
            positions={polyline.nodes}
            pathOptions={{ color: randomColor, weight: 10 }}
          />
        );
      })} */}
            {selectedNodes &&
                selectedNodes.map((nodeIds, index) => {
                    if (index === selectedNodes.length - 1) return null;
                    const start = nodeIds[2];
                    const end = selectedNodes[index + 1]
                        ? selectedNodes[index + 1][2]
                        : selectedNodes[0][2];
                    return (
                        <Polyline
                            key={index}
                            positions={[
                                [points[start].lat, points[start].lon],
                                [points[end].lat, points[end].lon],
                            ]}
                            pathOptions={{ color: "#18181b", weight: 10 }}
                        />
                    );
                })}
        </>
    );
};

export default FullPath;

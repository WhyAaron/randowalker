import React from "react";
import { Polyline } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { WayMap, NodeMap, IPolyline } from "../util/types";

interface FullPathProps {
  segments: WayMap;
  points: NodeMap;
  selectedNodes: number[][] | null;
}

const FullPath: React.FC<FullPathProps> = ({
  segments,
  points,
  selectedNodes,
}) => {
  if (selectedNodes === null) return <></>;
  const segmentsEntries = Object.entries(segments);
  const polylines: IPolyline[] = selectedNodes.map((nodeIds, index) => {
    const start = nodeIds[2];
    const end = selectedNodes[index + 1]
      ? selectedNodes[index + 1][2]
      : selectedNodes[0][2];
    let path: IPolyline | undefined;
    segmentsEntries.forEach((entry) => {
      const [, way] = entry;
      if (way.nodes.includes(start) && way.nodes.includes(end)) {
        const nodesArr = way.nodes.map(
          (nodeId) =>
            [points[nodeId].lat, points[nodeId].lon] as LatLngExpression
        );
        path = { id: `id-${index}`, nodes: nodesArr } as IPolyline;
      }
    });
    return path || { id: "0", nodes: [] };
  });

  return (
    <>
      {polylines.map((polyline) => {
        return (
          <Polyline
            key={polyline.id}
            positions={polyline.nodes}
            pathOptions={{ color: "#4d7c0f" }}
          />
        );
      })}
    </>
  );
};

export default FullPath;

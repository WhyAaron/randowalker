import React from "react";
import { Polyline } from "react-leaflet";
import { NodeMap } from "../util/types";
interface FullPathProps {
    points: NodeMap;
    fullPath: number[][] | null;
}

const FullPath: React.FC<FullPathProps> = ({ points, fullPath }) => {
    return (
        <>
            {fullPath &&
                fullPath.map((nodeIds, index) => {
                    if (index === fullPath.length - 1) return null;
                    const start = nodeIds[2];
                    const end = fullPath[index + 1]
                        ? fullPath[index + 1][2]
                        : fullPath[0][2];
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

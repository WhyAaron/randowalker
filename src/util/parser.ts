import { NodeMap, WayMap } from "../util/types";

export function extractNodesAndWays(apiResponse: any) {
    if (!apiResponse) return { nodes: {}, ways: {} }; //todo: error
    const nodes: NodeMap = {};
    const ways: WayMap = {};

    const elements = apiResponse["elements"];

    if (!elements) return { nodes, ways }; //todo: error

    elements.forEach((element: any) => {
        if (element.type === "node") {
            nodes[element.id] = {
                lat: element.lat,
                lon: element.lon,
            };
        } else if (element.type === "way") {
            ways[element.id] = {
                nodes: element.nodes,
            };
        }
    });

    return { nodes, ways };
}

export function extractSegmentsAndPoints(ways: WayMap) {
    const wayEntries = Object.entries(ways);

    const countDict: { [id: string]: number } = {};
    wayEntries.forEach((entry) => {
        const [, way] = entry;
        const nodeIds = way.nodes;
        nodeIds.forEach((nodeId) => {
            if (countDict[nodeId]) {
                countDict[nodeId] += 1;
            } else {
                countDict[nodeId] = 1;
            }
        });
    });

    const newWays: WayMap = {};
    wayEntries.forEach((entry) => {
        const [id, way] = entry;
        const nodeIds = way.nodes;
        let start = 0;
        let end = 0;
        for (let i = 0; i < nodeIds.length; i++) {
            const nodeId = nodeIds[i];
            if (countDict[nodeId] > 1) {
                end = i;
                const newId = `${id}-${i}`;
                const newNodes = nodeIds.slice(start, end + 1);
                newWays[newId] = { nodes: newNodes };
                start = end;
            }
        }

        const newId = `${id}-X`;
        const newNodes = nodeIds.slice(start, nodeIds.length);
        newWays[newId] = { nodes: newNodes };
    });

    return { segments: newWays };
}

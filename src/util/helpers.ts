import { NodeMap, Node } from "./types";
import { Feature, FeatureCollection, Point, GeoJsonProperties } from "geojson";
import * as turf from "@turf/turf";

export function generateMainPathPoints(
    centerOfMass: Feature<Point, GeoJsonProperties> | null,
    quadrants: Record<string, number[][]>,
    nodes: NodeMap,
    startNode: number | null,
    connectedNodes: number[] | null,
): number[][] {
    if (!centerOfMass) return [];

    const mainPathPoints: number[][] = [
        getRandomPointFromQuadrant(quadrants.topLeft),
        getRandomPointFromQuadrant(quadrants.topRight),
        getRandomPointFromQuadrant(quadrants.bottomRight),
        getRandomPointFromQuadrant(quadrants.bottomLeft),
    ];

    if (startNode && connectedNodes) {
        const nodePosition = determineNodePosition(nodes[startNode], centerOfMass);

        switch (nodePosition) {
            case "topLeft":
                mainPathPoints[0] = getNodeCoordinates(nodes, startNode);
                break;
            case "topRight":
                mainPathPoints[1] = getNodeCoordinates(nodes, startNode);
                break;
            case "bottomLeft":
                mainPathPoints[3] = getNodeCoordinates(nodes, startNode);
                break;
            case "bottomRight":
                mainPathPoints[2] = getNodeCoordinates(nodes, startNode);
                break;
        }
    }

    mainPathPoints.push(mainPathPoints[0]);

    return mainPathPoints;
}

export function getCenterOfMass(nodes: number[] | null, nodeMap: NodeMap): Feature<Point> | null {
    if (nodes === null || nodeMap === null) return null;
    const nodeCollection: FeatureCollection<Point> = turf.featureCollection(
        nodes.map((node) => turf.point([nodeMap[node].lon, nodeMap[node].lat])),
    );
    return turf.centerOfMass(nodeCollection);
}

export function generateQuadrants(
    connectedNodes: number[],
    nodes: NodeMap,
    centerOfMass: Feature<Point, GeoJsonProperties> | null,
): Record<string, number[][]> {
    const quadrants: Record<string, number[][]> = {
        topLeft: [],
        topRight: [],
        bottomLeft: [],
        bottomRight: [],
    };

    if (connectedNodes === null || centerOfMass === null) return quadrants;

    connectedNodes.forEach((nodeId) => {
        const nodePosition = determineNodePosition(nodes[nodeId], centerOfMass);

        switch (nodePosition) {
            case "topLeft":
                quadrants.topLeft.push(getNodeCoordinates(nodes, nodeId));
                break;
            case "topRight":
                quadrants.topRight.push(getNodeCoordinates(nodes, nodeId));
                break;
            case "bottomLeft":
                quadrants.bottomLeft.push(getNodeCoordinates(nodes, nodeId));
                break;
            case "bottomRight":
                quadrants.bottomRight.push(getNodeCoordinates(nodes, nodeId));
                break;
        }
    });

    return quadrants;
}

function determineNodePosition(node: Node, center: Feature<Point>): string {
    const isTop = node.lat < center.geometry.coordinates[1];
    const isLeft = node.lon < center.geometry.coordinates[0];

    return isTop ? (isLeft ? "topLeft" : "topRight") : isLeft ? "bottomLeft" : "bottomRight";
}

function getNodeCoordinates(nodes: NodeMap, nodeId: number): number[] {
    return [nodes[nodeId].lat, nodes[nodeId].lon, Number(nodeId)];
}

function getRandomPointFromQuadrant(quadrant: number[][]): number[] {
    if (quadrant.length === 0) return [];
    const randomIndex = Math.floor(Math.random() * quadrant.length);
    return quadrant[randomIndex];
}

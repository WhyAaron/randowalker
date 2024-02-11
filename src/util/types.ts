import { LatLngExpression } from "leaflet";

export interface Node {
    lat: number;
    lon: number;
}

export interface NodeMap {
    [id: string]: Node;
}

export interface Way {
    nodes: number[];
}

export interface WayMap {
    [id: string]: Way;
}

export interface Graph {
    [nodeId: number]: number[];
}

export interface IPolyline {
    id: string;
    nodes: LatLngExpression[];
}

export interface IPolylineMap {
    [id: string]: IPolyline;
}

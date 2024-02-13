import { extractNodesAndWays, extractSegmentsAndPoints } from "../src/util/parser.ts";
import { expect, test, describe } from "vitest";
import { data } from "../testdata/api-response.ts";

describe("Parser tests", () => {
    //todo: test extractNodesAndWays with empty response/changed structure/changed properties
    test("extractNodesAndWays", () => {
        const apiResponse = {
            elements: [
                {
                    type: "node",
                    id: 1,
                    lat: 1,
                    lon: 1,
                },
                {
                    type: "way",
                    id: 2,
                    nodes: [1, 2],
                },
            ],
        };
        const { nodes, ways } = extractNodesAndWays(apiResponse);
        expect(nodes).toEqual({ 1: { lat: 1, lon: 1 } });
        expect(ways).toEqual({ 2: { nodes: [1, 2] } });
    });
    test("extractSegmentsAndPoints", () => {
        const ways = {
            1: {
                nodes: [1, 2, 3, 4, 5],
            },
            2: {
                nodes: [6, 7, 3, 8, 9],
            },
        };
        const newWays = extractSegmentsAndPoints(ways);
        expect(newWays).toEqual({
            segments: {
                "1-2": { nodes: [1, 2, 3] },
                "1-X": { nodes: [3, 4, 5] },
                "2-2": { nodes: [6, 7, 3] },
                "2-X": { nodes: [3, 8, 9] },
            },
        });
    });
    test("extractNodesAndWays and extractSegmentsAndPoints with real data", () => {
        const { nodes, ways } = extractNodesAndWays(data);
        expect(nodes).toMatchSnapshot();
        expect(ways).toMatchSnapshot();
        const { segments } = extractSegmentsAndPoints(ways);
        expect(segments).toMatchSnapshot();
    });
});

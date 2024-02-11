import { LatLngTuple } from "leaflet";
import { useEffect, useReducer, useRef } from "react";

type State = {
    data?: object;
    error?: Error;
};

type Action =
    | { type: "loading" }
    | { type: "fetched"; data: object }
    | { type: "error"; error: Error };

function useFetch(position: LatLngTuple | null, radius: number, applicationState: string) {
    const reducer = (state: State, action: Action): State => {
        if (action.type === "loading") {
            return { ...initState };
        } else if (action.type === "fetched") {
            return { ...initState, data: action.data };
        } else if (action.type === "error") {
            return { ...initState, error: action.error };
        } else {
            return state;
        }
    };

    const initState = {
        data: undefined,
        error: undefined,
    };

    const [state, dispatch] = useReducer(reducer, initState);
    const stopStateUpdate = useRef<boolean>(false);

    const overpassUrl = "https://overpass-api.de/api/interpreter";

    useEffect(() => {
        if (applicationState !== "startSelection") return;
        if (!position) return;
        const fetchData = async () => {
            stopStateUpdate.current = false;
            dispatch({ type: "loading" });
            const fetchOptions = {
                method: "POST",
                body: `
              <osm-script output="json">
              <query type="way">
                <around lat="${position[0]}" lon="${position[1]}" radius="${radius || 1000}"/>
                <has-kv k="highway" regv="path|track|unclassified"/>
              </query>
              <union>
                <item/>
                <recurse type="down"/>
              </union>
              <print mode="body"/>
            </osm-script>
            `,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            };
            fetch(overpassUrl, fetchOptions)
                .then((response) => response.json())
                .then((data) => {
                    if (stopStateUpdate.current) return;
                    dispatch({ type: "fetched", data: data });
                })
                .catch((err) => {
                    if (stopStateUpdate.current) return;
                    dispatch({ type: "error", error: err });
                });
        };

        fetchData();
        () => {
            stopStateUpdate.current = true;
        };
    }, [applicationState, position, radius]);

    return state;
}

export default useFetch;

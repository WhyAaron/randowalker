import { useSelector } from "react-redux"
import { RootState } from "../util/store/store";


export default function PathInfo() {
    const length = useSelector((state: RootState) => state.mapData.length);
    if (length === null) return null;
    return (
        <div className="absolute bottom-0 right-0 bg-slate-100/70 h-1/4 w-1/4 z-10 rounded-md flex flex-col justify-center items-center m-10">
            <h2 className=" text-2xl">Info</h2>
            <p>Lenght: {length?.toFixed(2)}km</p>
            <p>Steps: {(length * 1200).toFixed()} - {(length * 1500).toFixed()}</p>
        </div>
    )
}

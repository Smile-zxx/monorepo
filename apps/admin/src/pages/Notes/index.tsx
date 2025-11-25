import React, { useEffect } from "react";
const action = (e: any) => {
    console.log('debug-row-target', e);
}
const action2 = (e: any) => {
    console.log('debug-row-warp', e);
}
const Notes = () => {
    useEffect(() => {
        const noteNode = document.getElementById("notes");
        if (noteNode) {
            noteNode.addEventListener("click", action);
        }
        const warpNode = document.getElementById("warp");
        if (warpNode) {
            warpNode.addEventListener("click", action2);
        }
        return () => {
            if (noteNode) {
                noteNode.removeEventListener("click", action);
            }
            if (warpNode) {
                warpNode.removeEventListener("click", action2);
            }
        };
    },)
    return <div id="warp"
        onClick={(e) => {
            console.log('debug-warp', e);
        }}>
        <div
            onClick={(e) => {
                console.log('debug-react', e);
            }}
            id="notes"
        >Notes</div>

    </div>

}

export default Notes;
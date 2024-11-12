import * as React from "react";
import { useCallback } from "react";
import {inspectorDataAtom} from "./inspector";
import { atom, useSetAtom, useAtom, useAtomValue} from "jotai";
import {default as createCXX} from "../cpp-build/rect-project";
import { useResizeObserver } from "../resizer-observer";
import { FormattedMessage } from "../intl";
import style from "./inspector.module.css";

var CXXPromise: any;

type AABB = {
    ax: number, ay:number, bx:number, by: number,
}

const rectListAtom = atom<AABB[]>([]);
const selectedAtom = atom<number|null>((get) => get(inspectorDataAtom).index);

export const Editor = () => {
    const [is2DCanvasSupported, setIs2DCanvasSupported] = React.useState(true);
    const [size, setSize] = React.useState([300, 300, "100%", "100%"]);
    let viewportRef = React.createRef<HTMLDivElement>(); // needed for the resize observer
    useResizeObserver(viewportRef, (width, height) => {
        setSize([width, height, `${width / devicePixelRatio}px`, `${height / devicePixelRatio}px`]);
    });
    let onClick = useEditorOnClick();
    const [width, height, widthPX, heightPX] = size;
    let refCallback = useEditor(setIs2DCanvasSupported, width, height);
    return <div className="viewport" style={{ flexBasis: "300px" }} ref={viewportRef}>
        {
            is2DCanvasSupported ? <canvas ref={refCallback}
                width={width} height={height}
                style={{ width: widthPX, height: heightPX }}
                onClick={onClick}
            />
                : <p><FormattedMessage id="2D-canvas-not-available" defaultMessage="2D canvas not available" /></p>
        }
    </div>;
}

export function useEditor(
    setIs2DCanvasSupported: (arg:boolean)=>void,
    width: number, height: number,
) {
    const [rectList, setRectList] = useAtom(rectListAtom);
    const selectedIndex = useAtomValue(selectedAtom);
    let canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    React.useEffect(() => {
        if (CXXPromise) {return;}
        CXXPromise = createCXX();
        (async () => {
            let incomingRectList: AABB[] = [];
            let floatList: Float32Array = (await CXXPromise).getRectList(Math.random() * 999999);
            for (let i = 0; i < floatList.length; i += 4) {
                let [x, y, width, height] = floatList.slice(i, i + 4);
                incomingRectList.push({ax: x, ay: y, bx: x + width, by: y + height});
            }
            setRectList(incomingRectList);
        })();
    }, [setRectList]);
    const renderer = useCallback((canvas: HTMLCanvasElement | null) => {
        if (canvas === null) { return; }

        if (!canvasRef.current && !canvas.getContext("2d")) {
            setIs2DCanvasSupported(false);
            return;
        }
        canvasRef.current = canvas;
        renderEditor(canvas, rectList, selectedIndex);
    }, [setIs2DCanvasSupported, rectList, selectedIndex, width, height]);
    return renderer;
}

export function renderEditor(
    canvas: HTMLCanvasElement,
    rectList: AABB[],
    selected: number|null
) {
    let ctx = canvas?.getContext("2d");
    if (!ctx) {
        throw new Error("getContext 2D failed")
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const getRect = (aabb: AABB) => {
        return [
            aabb.ax * devicePixelRatio, aabb.ay * devicePixelRatio,
            (aabb.bx - aabb.ax) * devicePixelRatio, (aabb.by - aabb.ay) * devicePixelRatio
        ];
    }
    rectList.forEach((aabb, index) => {
        const [x, y, w, h] = getRect(aabb);
        ctx.fillStyle = "oklch(50.51% 0.1585 30.44)";
        ctx.fillRect(x, y, w, h);
    });
    if (selected !== null) {
        const [x, y, w, h] = getRect(rectList[selected]);
        ctx.strokeStyle = "oklch(19.04% 0.0425 147.77)";
        ctx.lineWidth = 2 * devicePixelRatio;
        ctx.strokeRect(x, y, w, h);
    }
}

export function useEditorOnClick(): React.MouseEventHandler<HTMLCanvasElement> {
    const setInspectorDataAtom = useSetAtom(inspectorDataAtom);
    const rectList = useAtomValue(rectListAtom);
    return React.useCallback((event) => {
        const viewRect = event.target?.getBoundingClientRect();
        const x = event.clientX - viewRect.left;
        const y = event.clientY - viewRect.top;
        let clickedRectIndex = rectList.findIndex((rect) => {
            // aabb
            return rect.ax <= x && rect.ay <= y && x <= rect.bx && y <= rect.by;
        });
        if (clickedRectIndex !== -1) {
            let rect = rectList[clickedRectIndex];
            setInspectorDataAtom({
                index: clickedRectIndex,
                message: <div className="grid grid-cols-2">
                    <span className={style.property}><div className={style.label}>ax</div> <div className={style.number}>{rect.ax.toFixed(4)}</div></span>
                    <span className={style.property}><div className={style.label}>ay</div> <div className={style.number}>{rect.ay.toFixed(4)}</div></span>
                    <span className={style.property}><div className={style.label}>bx</div> <div className={style.number}>{rect.bx.toFixed(4)}</div></span>
                    <span className={style.property}><div className={style.label}>by</div> <div className={style.number}>{rect.by.toFixed(4)}</div></span>
                </div>,
            });
        } else {
            setInspectorDataAtom({
                index: null,
                message: <p>Null</p>,
            });
        }
    }, [rectList, setInspectorDataAtom])
}
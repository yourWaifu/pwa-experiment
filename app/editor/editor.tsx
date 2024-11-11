import * as React from "react";
import { useCallback } from "react";
import {inspectorDataAtom} from "./inspector";
import { atom, useSetAtom, useAtom, useAtomValue} from "jotai";
import {default as createCXX} from "../cpp-build/rect-project";
import { useResizeObserver } from "../resizer-observer";
import { FormattedMessage } from "../intl";

var CXXPromise: any;

type AABB = {
    ax: number, ay:number, bx:number, by: number,
}

const rectListAtom = atom<AABB[]>([]);

export const Editor = () => {
    const [is2DCanvasSupported, setIs2DCanvasSupported] = React.useState(true);
    const [size, setSize] = React.useState([300, 300, "300px", "300px"]);
    let viewportRef = React.createRef<HTMLDivElement>(); // needed for the resize observer
    let nullRef = React.createRef<HTMLCanvasElement>();
    let canvasRef = React.createRef<HTMLCanvasElement>();
    useResizeObserver(viewportRef, nullRef, (width, height) => {
        setSize([width, height, `${width / devicePixelRatio}px`, `${height / devicePixelRatio}px`]);
    });
    let onClick = useEditorOnClick();
    useEditor(canvasRef, size, setIs2DCanvasSupported);
    const [width, height, widthPX, heightPX] = size;
    return <div className="viewport" style={{ flexBasis: "300px" }} ref={viewportRef}>
        {
            is2DCanvasSupported ? <canvas ref={canvasRef}
                width={width} height={height}
                style={{ width: widthPX, height: heightPX }}
                onClick={onClick}
            />
                : <p><FormattedMessage id="2D-canvas-not-available" defaultMessage="2D canvas not available" /></p>
        }
    </div>;
}

type Renderer = {canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D};

export function useEditor(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    size: [number, number],
    setIs2DCanvasSupported: (arg:boolean)=>void
) {
    const [rectList, setRectList] = useAtom(rectListAtom);
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
    React.useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        let ctx = canvasRef.current?.getContext("2d");
        if (!ctx) {
            setIs2DCanvasSupported(false);
            return;
        }
        renderEditor(ctx, canvasRef.current, rectList)
    }, [canvasRef, rectList]);
}

export function renderEditor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, rectList: AABB[]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let rect of rectList) {
        ctx.fillRect(
            rect.ax * devicePixelRatio, rect.ay * devicePixelRatio,
            (rect.bx - rect.ax) * devicePixelRatio, (rect.by - rect.ay) * devicePixelRatio
        );
    }
}

export function useEditorOnClick(): React.MouseEventHandler<HTMLCanvasElement> {
    const setInspectorDataAtom = useSetAtom(inspectorDataAtom);
    const rectList = useAtomValue(rectListAtom);
    return React.useCallback((event) => {
        const viewRect = event.target?.getBoundingClientRect();
        const x = event.clientX - viewRect.left;
        const y = event.clientY - viewRect.top;
        let clickedRectList = rectList.filter((rect) => {
            // aabb
            return rect.ax <= x && rect.ay <= y && x <= rect.bx && y <= rect.by;
        });
        if (0 < clickedRectList.length) {
            let rect = clickedRectList[0];
            setInspectorDataAtom(<p>
                ax {rect.ax.toFixed(4)} <span>ay {rect.ay.toFixed(4)}</span><br />
                bx {rect.bx.toFixed(4)} <span>by {rect.by.toFixed(4)}</span>
            </p>);
        } else {
            setInspectorDataAtom(<p>Null</p>);
        }
    }, [rectList])
}
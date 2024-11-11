import * as React from "react";

export function useResizeObserver(
    target: React.RefObject<HTMLDivElement>,
    resize: ((w: number, h: number) => void) | undefined
) {
    React.useEffect(() => {
        if (!target.current) {
            return;
        }
        const observer = new ResizeObserver(([entry]) => {
            let width = entry.devicePixelContentBoxSize[0].inlineSize ??
                entry.contentBoxSize[0].inlineSize * devicePixelRatio;
            let height = entry.devicePixelContentBoxSize[0].blockSize ??
                entry.contentBoxSize[0].blockSize * devicePixelRatio;
            resize?.(width, height);
        });
        observer.observe(target.current);
    }, [target.current, resize]);
}
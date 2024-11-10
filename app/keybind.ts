let isShiftKeyDown: boolean = false;
export const getShiftKeyDown = () => isShiftKeyDown;
let isCtrlKeyDown: boolean = false;
export const getCtrlKeyDown = () => isCtrlKeyDown;

function onKey(event: React.KeyboardEvent) {
    isShiftKeyDown = event.shiftKey;
    isCtrlKeyDown = event.ctrlKey;
}

export function onKeydown(event: React.KeyboardEvent<HTMLDivElement>) {
    onKey(event);
}
export function onKeyUp(event: React.KeyboardEvent<HTMLDivElement>) {
    onKey(event);
}
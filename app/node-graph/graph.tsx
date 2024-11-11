import { Style } from "util";
import { gridStyle, viewTransformAtom } from "./grid";
import graphStyle from "./graph.module.css";
import * as React from "react";
import { useAtom, useAtomValue } from "jotai";
import { getShiftKeyDown, getCtrlKeyDown } from "../keybind";
import { FormattedMessage } from "../intl";

const Node = (
  { declearion, style, position }: {
    declearion: {
      formatedDisplayName: string | React.JSX.Element,
      inputs?: [{ key: string, formatedDisplayName: string | React.JSX.Element }],
      outputs?: [{ key: string, formatedDisplayName: string | React.JSX.Element }],
    },
    style?: React.CSSProperties,
    position: { x: number, y: number }
  }
) => {
  let commputedStyle = { ...style, left: `${position.x}px`, bottom: `${position.y}px` };
  return <div className={graphStyle.nodeContainer} style={commputedStyle} >
    <div className={graphStyle.node} >
      <div style={{ textAlign: "center" }}>{declearion.formatedDisplayName}</div>
      {
        declearion.inputs ? declearion.inputs.map((input) => {
          return <div key={input.key} className={graphStyle.input}>
            <span>{"[in] "}</span><span>{input.formatedDisplayName}</span>
          </div>
        })
          : <></>
      }
      {
        declearion.outputs ? declearion.outputs.map((output) => {
          return <div key={output.key} className={graphStyle.output} >
            <span>{" [out]"}</span><span>{output.formatedDisplayName}</span>
          </div>;
        })
          : <></>
      }
    </div>
  </div>
}

export const VisualProgrammingEditor = ({ style }: { style: React.CSSProperties }) => {
  const viewTransform = useAtomValue(viewTransformAtom);
  
  //we need to prevent the default behavior to override them
  // but react uses passive events by default, so we need to add via the event handler
  let refCallback = useVisualProgrammingEditorInputs();

  return <div className={graphStyle.graph} style={style} ref={refCallback}>
    <div style={gridStyle()}></div>
    <div style={{
      left: `calc(50% * ${viewTransform.z})`,
      top: `calc(-50% * ${viewTransform.z})`,
      transform: `translate(${viewTransform.x * viewTransform.z}px, ${0 - viewTransform.y * viewTransform.z}px) scale(${viewTransform.z})`,
      minHeight: "100%",
      position: "relative",
    }}>

      <Node
        declearion={{
          formatedDisplayName: <FormattedMessage id="node1-name" defaultMessage="Node" />,
          outputs: [
            {
              key: "first",
              formatedDisplayName: <FormattedMessage id="node1-output-name" defaultMessage="bar" />
            }
          ]
        }}
        position={{ x: -50, y: 50 }}
      />

      <Node
        declearion={{
          formatedDisplayName: <FormattedMessage id="node2-name" defaultMessage="Result" />,
          inputs: [
            {
              key: "2nd",
              formatedDisplayName: <FormattedMessage id="node2-input-name" defaultMessage="foo" />
            }
          ]
        }}
        position={{ x: 50, y: -50 }}
      />

      <Node
        declearion={{
          formatedDisplayName: <FormattedMessage id="center-label" defaultMessage="center" />,
        }}
        position={{ x: 0, y: 0 }}
      />

      <Node declearion={{ formatedDisplayName: "|" }} position={{ x: 200, y: 200 }} />

    </div>
  </div>
}

const useVisualProgrammingEditorInputs = () => {
  const [viewTransform, setViewTransform] = useAtom(viewTransformAtom);

  // store muliple pointers for multi-touch
  // use state fixes a bug where it turns empty
  const [getEventCache, setEventCache] = React.useState(new Map<number, PointerEvent>([]));
  let [initPinchDistance, setInitPinchDistance] = React.useState<number | null>(null);
  let [initScale, setInitScale] = React.useState<number>(1);

  let eventCache = new Map(getEventCache);
  
  // these are functions because I can't decide to go with array or map
  // I might switch again, so these are here to make that easier
  // remember to remove them once I made up my mind
  const findInEventCache = (event: PointerEvent) => {
    return eventCache.get(event.pointerId)
  };
  const removeFromCache = (event: PointerEvent) => {
    return eventCache.delete(event.pointerId);
  };
  const addToCache = (event: PointerEvent) => {
    eventCache.set(event.pointerId, event);
    return event;
  }
  const setCache = (key:any, event: PointerEvent) => { // useful for array
    return addToCache(event);
  }
  const matchCache = (left: any, index: number) => {
    return left.pointerId === Array.from(eventCache.values())[index]?.pointerId;
  }

  const onWheel = React.useCallback(
    (event: WheelEvent) => {
      // scale value is different between user agents, we have to handle that here
      const transform = viewTransform;
      let scale = transform.z;
      if (getCtrlKeyDown()) { // zoom modifier
        const sensitivity = 0.1;
        scale = transform.z * (1 - (sensitivity * Math.sign(event.deltaY)));
        setViewTransform({
          ...transform,
          z: scale
        });
      } else {
        const sensitivity = 25.0;
        const delta = { // shift swaps axis
          x: !getShiftKeyDown() ? event.deltaX : event.deltaY,
          y: !getShiftKeyDown() ? event.deltaY : event.deltaX,
        };
        setViewTransform({
          ...transform,
          x: transform.x - ((sensitivity * Math.sign(delta.x)) / scale),
          y: transform.y + ((sensitivity * Math.sign(delta.y)) / scale),
        });
      }
      event.preventDefault();
      event.stopPropagation();
    },
    [viewTransform]
  );

  const onPointerdown = React.useCallback((event: PointerEvent) => {
    // pen input should be ignored for moving, as pens work very differently
    if (event.pointerType === "pen") {
      return;
    }
    event.preventDefault();
  }, []);

  const onPointerup = React.useCallback((event: PointerEvent) => {
    if (event.pointerType === "pen") {
      return;
    }
    removeFromCache(event);
    setEventCache(eventCache);
    event.preventDefault();
  }, [getEventCache]);

  const onPointermove = React.useCallback((event: PointerEvent) => {
    // same as before, ignore pen because it's different
    if (event.pointerType === "pen") {
      console.log("pen");
      return;
    }

    // edge case for when mouse moves out of element
    let isLeftMouseDown = true;
    if (event.pointerType === "mouse") {
      isLeftMouseDown = (event.buttons & 1) !== 0;
      if (!isLeftMouseDown) {
        removeFromCache(event);
        setEventCache(eventCache);
        return;
      }
    }

    let found = findInEventCache(event);
    if (found === undefined) {
      found = addToCache(event);
    }
    setCache(found, event);

    // zoom gesture check
    let scale = viewTransform.z;
    if (eventCache.size === 2) {
      // calulate distance between touch points
      const points = Array.from(eventCache.values()).map(event => {
        return {
          x: event.clientX,
          y: event.clientY,
        };
      });
      const box = {
        x: points[0].x - points[1].x,
        y: points[0].y - points[1].y,
      }
      // euclidean disteance from Pythagoras
      const distance = Math.sqrt(Math.pow(box.x, 2) + Math.pow(box.y, 2));
      if (initPinchDistance === null) {
        setInitPinchDistance(distance);
        setInitScale(scale);
        scale = initScale * distance;
      } else {
        scale = initScale * (distance / initPinchDistance);
      }
    } else {
      setInitPinchDistance(null);
      setInitScale(scale);
    }

    let { x, y } = viewTransform;
    if (matchCache(event, 0)) { // first pointer, so might be moving around
      // this doesn't seem to very accurate, fast movement seems to throw it off
      // probably better to get a path from last a moment ago to current point
      let deltaMove = { x: event.movementX, y: event.movementY };
      x += deltaMove.x / scale;
      y -= deltaMove.y / scale; // web is inverted
    }

    setViewTransform({
      x, y,
      z: scale,
    });
    setEventCache(eventCache);
  }, [viewTransform, getEventCache]);
  
  let ref = React.useRef<HTMLDivElement | null>(null);
  return React.useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      if (ref.current) {
        ref.current.removeEventListener("wheel", onWheel);
        ref.current.removeEventListener("pointerdown", onPointerdown);
        ref.current.removeEventListener("pointerup", onPointerup);
        ref.current.removeEventListener("pointermove", onPointermove);
      }
      return;
    }

    ref.current = node;
    node.addEventListener("wheel", onWheel, {passive: false})
    node.addEventListener("pointerdown", onPointerdown, {passive: false});
    node.addEventListener("pointerup", onPointerup, {passive: false});
    node.addEventListener("pointermove", onPointermove, {passive: false});
  }, [onWheel, onPointerdown, onPointermove, onPointerup]);
}
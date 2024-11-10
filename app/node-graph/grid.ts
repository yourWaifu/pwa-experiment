import { atom, useAtom } from "jotai";
export const viewTransformAtom = atom({x: 0, y: 0, z: 1});

// The reason this is a function is because the style is dynamic
export function gridStyle(): React.CSSProperties {
  const [viewTransform, setViewTransform] = useAtom(viewTransformAtom);
  const scale = viewTransform.z;
  const size = 50 * scale;
  const thickness = 1 * scale;
  return {
    backgroundSize: `${size}px ${size}px`,
    backgroundImage: `linear-gradient(to right, transparent ${(size-thickness)/2}px, oklch(0.7567 0 147.18) ${(size/2)-thickness}px, oklch(0.7567 0 147.18) ${(size+thickness)/2}px, transparent ${(size+thickness)/2}px), linear-gradient(transparent ${(size-thickness)/2}px, oklch(0.7567 0 147.18) ${(size/2)-thickness}px, oklch(0.7567 0 147.18) ${(size+thickness)/2}px, transparent ${(size+thickness)/2}px)`,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundPosition: `calc(50% + ${viewTransform.x * scale}px ) calc(50% - ${viewTransform.y * scale }px)`,
  };
}

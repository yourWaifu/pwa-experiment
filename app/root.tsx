import { atom, useAtom, useAtomValue } from "jotai";
import { generateIntl, intlAtom, FormattedMessage } from "./intl.js";
import { defineMessage, IntlShape } from "@formatjs/intl";
import * as React from "react";
import { useState, Suspense } from 'react';
import useResizeObserver from "@react-hook/resize-observer";
import { Links, Meta, Outlet, Scripts } from "@remix-run/react";
import { VisualProgrammingEditor } from "./node-graph/graph";
import { MetaFunction } from "@remix-run/node/dist/index.js";
import { onKeydown, onKeyUp } from "./keybind.js";
import { init as CameraInit } from "./cameras/main";

// I'm not using CSS-in-JS for preformance reasons, CSS will be in CSS files or inlined
// CSS-in-JS requires the app to be rendered before it knows what the styles are. This
// breaks a few of Remix's optimzations like defer.
// CSS is imported via Vite's CSS bundling as seen below
import "./main.css";

export const meta: MetaFunction = () => {
  return [
    { charSet: "utf-8" }
  ];
}

// Language changing

const localeAtom = atom('en-US', (get, set, action) => {
  set(intlAtom, generateIntl(action as string));
});

function useIntlRoot(locale: string) {
  const [intl, setIntl] = useAtom(intlAtom);
  if (!intl) {
    setIntl(generateIntl(locale));
  }
}

const LocaleChangeButton = ({locale}:{locale: string}) => {
  const [currentLocale, setLocale] = useAtom(localeAtom);
  const intl = useAtomValue(intlAtom);
  return <button type="button" onClick={() => setLocale(locale)}>
    <Suspense fallback={locale}> {
        intl?.formatDisplayName(locale, { type: "language"})
    } </Suspense>
  </button>;
}

// Top bar

const TopBar = () => {
  return <div id="titleBar" className="titleBar">
    <div className="titleBarStart">
      <span>
        <FormattedMessage
          id="menu-text" defaultMessage="Main Menu"
          description="placeholder text for main menu" />
      </span>
      <div className="titleBarDragArea" />
    </div>
    <div className="titleBarCenterText">
      <FormattedMessage id="app-name" defaultMessage="PWA test app" />
    </div>
    <div className="titleBarEnd">
      <div className="titleBarDragArea" />
      <div style={{"appRegion": "no-drag", "height": "100%"} as React.CSSProperties} />
    </div>
  </div>;
}

// Viewport

const gpuIsSupportedAtom = atom(true);

// loading screen for viewport
const ViewportFallback = () => {
  return <p>Loading ...</p>;
}

// Only render after hydration
const Viewport = () => {
  const [gpuIsSupported, setGpuIsSupported] = useAtom(gpuIsSupportedAtom);
  const [canvasError, setCanvasError] = React.useState<string>("");
  const [resize, setResize] = React.useState<{resize: ( w:number, h:number ) => void}>();
  const [{width, height, widthCSS, heightCSS}, setRect] =
    React.useState<{width: number, height: number, widthCSS: string, heightCSS:string}>(
      {width: 128, height: 128, widthCSS: "100%", heightCSS: "100%"}
    );
  
  let viewportRef = React.createRef<HTMLDivElement>(); // needed for the resize observer
  let canvasRef = React.createRef<HTMLCanvasElement>(); // needed for init Camera
  useViewport(viewportRef, canvasRef, resize?.resize);

  return <div ref={viewportRef} className="viewport">
    {
      gpuIsSupported ? <canvas
        ref={canvas => {
          if (!canvas || resize) {
            return;
          }
          // Init WebGPU
          if (!navigator.gpu) {
            setGpuIsSupported(false);
            setCanvasError("WebGPU not supported on this broswer");
          }
          (async () => {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
              setGpuIsSupported(false);
              setCanvasError("request GPU Adapter failed");
            }

            let camera = await CameraInit({canvas});
            console.log("setting setresize")
            const resize: ( w:number, h:number ) => void = (width, height) => {
              if (isNaN(width) || isNaN(height)) {
                return;
              }
              const {device, resizeCanvas} = camera;
              // we want to keep this the same, so we have edit the values directly
              setRect({
                width: Math.max(1, Math.min(width, device.limits.maxTextureDimension2D)),
                height: Math.max(1, Math.min(height, device.limits.maxTextureDimension2D)),
                widthCSS: `${width/devicePixelRatio}px`,
                heightCSS: `${height/devicePixelRatio}px`
              });
              resizeCanvas(width, height);
            };
            // resize has to be an object, otherwise, setResize calls it
            setResize({resize});
          })();
        }}
        width={width} height={height}
        // set width and height for high DPI screens
        style={{width: widthCSS, height: heightCSS}}
        ></canvas>
        : <p>
          <FormattedMessage id="webGPU-not-avaiable"
            defaultMessage="webGPU not found in your broswer" />
          <br />
          {canvasError}
        </p>
    }
  </div>
}

function useViewport(
  target: React.RefObject<HTMLDivElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  resize: ((w: number, h: number) => void) | undefined
) {
  React.useEffect(() => {
    if (!target.current) {
      return;
    }
    console.log("setting observer")
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

// Node editor

const NodeEditor = () => {
  return <VisualProgrammingEditor style={{flexBasis: "300px"}} />
}

// App

const SidePanel = () => {
  return <div className="sidePanel">
      <LocaleChangeButton locale="en-US" />
      <LocaleChangeButton locale="zh-Hans" />
      <LocaleChangeButton locale="zh-Hant" />
      <br />
      <FormattedMessage id="app-description" />
  </div>
}

export default function App() {
  let canvas;
  const [locale] = useAtom(localeAtom);
  useIntlRoot(locale);

  // to do add onKeyDown
  return (
  <html lang={locale}>
    <head>
      <Links />
      <Meta />
    </head>
    <body style={{margin: 0}}>
      <Scripts />
      <div className="app" onKeyDown={onKeydown} onKeyUp={onKeyUp}>
        <TopBar />
        <div className="rowPanels" >
          <div className="columnPanels" >
            <Suspense fallback={<ViewportFallback />}><Viewport /></Suspense>
            <Suspense fallback={<ViewportFallback />}><NodeEditor /></Suspense>
          </div>
          <SidePanel />
        </div>
      </div>
    </body>
  </html>
  );
}
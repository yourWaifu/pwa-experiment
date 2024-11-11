import { atom, useAtom, useAtomValue } from "jotai";
import { generateIntl, intlAtom, FormattedMessage } from "./intl.js";
import { defineMessage, IntlShape } from "@formatjs/intl";
import * as React from "react";
import { useState, Suspense } from 'react';
import { Form, Links, Meta, Outlet, Scripts } from "@remix-run/react";
import { VisualProgrammingEditor } from "./node-graph/graph";
import { MetaFunction } from "@remix-run/node/dist/index.js";
import { onKeydown, onKeyUp } from "./keybind.js";
import { init as CameraInit } from "./cameras/main";
import { Editor, renderEditor, useEditorOnClick } from "./editor/editor";
import { inspectorDataAtom } from "./editor/inspector";

// I'm not using CSS-in-JS for preformance reasons, CSS will be in CSS files or inlined
// CSS-in-JS requires the app to be rendered before it knows what the styles are. This
// breaks a few of Remix's optimzations like defer.
// CSS is imported via Vite's CSS bundling as seen below
import "./main.css";
import { useResizeObserver } from "./resizer-observer.js";

const titleMessage = defineMessage({
  id:"app-name", defaultMessage:"PWA test app"
});
export const meta: MetaFunction = () => {
  return [
    { charSet: "utf-8" },
    { title: "PWA experiment" }
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
      <FormattedMessage {...titleMessage} />
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
  useResizeObserver(viewportRef, resize?.resize);

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

const InspectorPanel = () => {
  const inspectorData = useAtomValue(inspectorDataAtom);

  return <div className="sidePanel">
    {inspectorData}
  </div>
}

const Title = () => {
  const intl = useAtomValue(intlAtom);
  React.useEffect(() => {
    // use effect to avoid hydration
    if (intl) {
      document.title = intl.formatMessage(titleMessage);
    }
  }, [intl]);
  return <></>;
}

export default function App() {
  let canvas;
  const [locale] = useAtom(localeAtom);
  useIntlRoot(locale);

  return (
  <html lang={locale}>
    <head>
      <Links />
      <Meta />
      <Title />
    </head>
    <body style={{margin: 0}} onKeyDown={onKeydown} onKeyUp={onKeyUp}>
      <Scripts />
      <div className="app">
        <div className="rowPanels" >
          <div className="columnPanels" >
            <Suspense fallback={<ViewportFallback />}><Viewport /></Suspense>
            <Editor />
            <Suspense fallback={<ViewportFallback />}><NodeEditor /></Suspense>
          </div>
          <div className="columnPanels">
            <SidePanel />
            <br />
            <InspectorPanel />
          </div>
        </div>
      </div>
    </body>
  </html>
  );
}
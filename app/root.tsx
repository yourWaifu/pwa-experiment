import { atom, useAtom, useAtomValue } from "jotai";
import { generateIntl, intlAtom, FormattedMessage } from "./intl.js";
import { defineMessage, IntlShape } from "@formatjs/intl";
import * as React from "react";
import { useState, Suspense } from 'react';
import useResizeObserver from "@react-hook/resize-observer";
import { Links, Meta, Outlet, Scripts } from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { VisualProgrammingEditor } from "./node-graph/graph";
import { MetaFunction } from "@remix-run/node/dist/index.js";
import { onKeydown, onKeyUp } from "./keybind.js";

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
      <LocaleChangeButton locale="en-US" />
      <LocaleChangeButton locale="zh-Hans" />
      <LocaleChangeButton locale="zh-Hant" />
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

function useResizable(target: React.RefObject<HTMLDivElement>) {
  const [size, setSize] = React.useState<{
    width: number, height: number, widthPX: number, heightPX: number
  }>();

    /*useResizeObserver(target, (entry) => setSize(
    entry.devicePixelContentBoxSize?.[0] ? {
      width: entry.devicePixelContentBoxSize[0].inlineSize,
      height: entry.devicePixelContentBoxSize[0].blockSize,
      widthPX: entry.contentRect.width,
      heightPX: entry.contentRect.height
    } : {
      width: entry.contentBoxSize[0].inlineSize * devicePixelRatio,
      height: entry.contentBoxSize[0].blockSize * devicePixelRatio,
      widthPX: entry.contentBoxSize[0].inlineSize,
      heightPX: entry.contentBoxSize[0].blockSize,
    }
  ))*/

  React.useEffect(() => {
    let boundingBox = target?.current?.getBoundingClientRect();
    if (!boundingBox) return;
    setSize({
      ...(boundingBox),
      widthPX: boundingBox?.width,
      heightPX: boundingBox?.height,
    });
  }, []);
  return size;
}

// loading screen for viewport
const ViewportFallback = () => {
  return <p>Loading ...</p>;
}

// Only render after hydration
const Viewport = () => {
  const [gpuIsSupported, setGpuIsSupported] = useAtom(gpuIsSupportedAtom);
  const [canvasError, setCanvasError] = React.useState<string>(null);
  let viewportRef = React.createRef<HTMLDivElement>(); // needed for the resize observer
  const size = useResizable(viewportRef);
  let width = size?.width ?? 10;
  let height = size?.height ?? 2;

  return <div ref={viewportRef} className="viewport">
    {
      gpuIsSupported ? <canvas
        ref={async canvas => {
          // Init WebGPU
          if (!navigator.gpu) {
            setGpuIsSupported(false);
            setCanvasError("WebGPU not supported on this broswer");
          }
          const adapter = await navigator.gpu.requestAdapter();
          if (!adapter) {
            setGpuIsSupported(false);
            setCanvasError("request GPU Adapter failed");
          }

          //let devicePromise = CameraInit({canvas});
        }}
        width={width} height={height}
        // set width and height for high DPI screens
        style={{width: `${size?.heightPX ?? 5}px`, height: `${size?.widthPX ?? 1}px`}}
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
  return <div className="sidePanel"></div>
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
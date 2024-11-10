# pwa experiment

a experiment I did a year ago to port an app to web APIs

```
npm install
npm run build
```

In another terminal:

```
node server.js
```

## Run in Web

### Prerequisites

a broswer with webGPU support, [here's a list of them: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility).

Some of them require enabling webGPU, often as a flag or a option in the settings.

* [Chrome & Edge: https://developer.chrome.com/blog/new-in-webgpu-113/#enable_the_feature](https://developer.chrome.com/blog/new-in-webgpu-113/#enable_the_feature)
* [Firefox: https://stackoverflow.com/questions/73706354/how-to-try-webgpu-in-firefox-nightly-now-in-fall-of-2022](https://stackoverflow.com/questions/73706354/how-to-try-webgpu-in-firefox-nightly-now-in-fall-of-2022)

[Test it by loading up a sample: https://webgpu.github.io/webgpu-samples/](https://webgpu.github.io/webgpu-samples/)

## Run

```
npm install
npm run build
node server.js
```

it should say that the web server started and display a URL. Open that URL in your broswer.
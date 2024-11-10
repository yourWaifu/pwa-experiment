import Koa from "koa";
import KoaServe from "koa-static";
import compress from "koa-compress"
import appRoot from "app-root-path";
import path from "node:path";
import {createRequestHandler} from "remix-koa-adapter";

const app = new Koa();
const rootPath = appRoot.path;
const buildPath = path.join(rootPath, "build");

app.use(compress({
    threshold: 1024,
    defaultEncoding: "br",
    br: {}
}));
app.use(KoaServe(path.join(buildPath, "client")));
app.use(createRequestHandler({
    build: await import(`file://${path.join(buildPath, "server/index.js")}`)
}));

console.log("web server stated. go to http://localhost:3000");
app.listen(3000);
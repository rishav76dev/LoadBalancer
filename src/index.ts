import express from "express";
import { ProxyHandler } from "./proxy/proxyHandler.ts"

const app = express();

app.use("/", ProxyHandler(loadbalancer, backendPool))

app.listen(3000, () => {
    console.log("load balancer is runnig on 8000")
})
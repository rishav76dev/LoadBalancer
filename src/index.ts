import express from "express";
import { ProxyHandler } from "./proxy/proxyHandler.ts"
import { LoadBalancer } from "./balancer/loadBalancer.ts";
import { BackendPool } from "./balancer/pool.ts";
import { RoundRobin } from "./balancer/roundRobin.ts";

const app = express();

const backendUrls = [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003"
];

const backendPool = new BackendPool(backendUrls);
const strategy = new RoundRobin();
const loadBalancer = new LoadBalancer(backendPool, strategy);

app.use("/", ProxyHandler(loadBalancer, backendPool))

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Load balancer is running on port ${PORT}`);
});
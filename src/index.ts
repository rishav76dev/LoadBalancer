import express from "express";
import { ProxyHandler } from "./proxy/proxyHandler.ts"
import { LoadBalancer } from "./balancer/loadBalancer.ts";
import { BackendPool } from "./balancer/pool.ts";
import { RoundRobin } from "./balancer/roundRobin.ts";
import { HealthChecker } from "./healthchecker/healthChecker.ts";
import { Logger } from "./utils/logger.ts";

const app = express();

const backendUrls = [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003"
];

const backendPool = new BackendPool(backendUrls);
const strategy = new RoundRobin();
const loadBalancer = new LoadBalancer(backendPool, strategy);


const healthChecker = new HealthChecker(backendPool, 5000);
healthChecker.start();
Logger.info("Health checker started (checking every 5s)");

app.use("/", ProxyHandler(loadBalancer, backendPool))

const PORT = 3000;
app.listen(PORT, () => {
    Logger.info(`Load balancer running on port ${PORT}`);
    Logger.info(`Backend servers: ${backendUrls.join(", ")}`);
});
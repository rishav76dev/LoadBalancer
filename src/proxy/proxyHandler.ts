import proxy from "express-http-proxy";
import type { Request, Response, NextFunction } from "express";
import { LoadBalancer } from "../balancer/loadBalancer.js";
import { BackendPool } from "../balancer/pool.ts";

export function ProxyHandler(
  loadBalancer: LoadBalancer,
  backendPool: BackendPool
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let backend;

    try {
      backend = loadBalancer.pickBackend();
    } catch (err) {
      res.status(503).send("No healthy backends available");
      return;
    }

    const proxyMiddleware = proxy(backend.url, {
      proxyErrorHandler: (err, res, next) => {
        console.error(`Backend failed: ${backend.url}`);

        backendPool.markUnhealthy(backend.url);

        res.status(502).send("Bad gateway");
      }
    });
    return proxyMiddleware(req, res, next);
  };
}

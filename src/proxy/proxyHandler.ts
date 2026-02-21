import proxy from "express-http-proxy";
import type { Request, Response, NextFunction } from "express";
import { LoadBalancer } from "../balancer/loadBalancer.ts";
import { BackendPool } from "../balancer/pool.ts";
import { Logger } from "../utils/logger.ts";

export function ProxyHandler(
  loadBalancer: LoadBalancer,
  backendPool: BackendPool
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    let backend;

    try {
      backend = loadBalancer.pickBackend();
    } catch (err) {
      Logger.error("No healthy backends available");
      res.status(503).send("No healthy backends available");
      return;
    }

    Logger.request(req.method, req.path, backend.url);

    const proxyMiddleware = proxy(backend.url, {
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        const duration = Date.now() - startTime;
        Logger.response(req.method, req.path, backend.url, proxyRes.statusCode || 0, duration);
        return proxyResData;
      },
      proxyErrorHandler: (err, res, next) => {
        const duration = Date.now() - startTime;
        Logger.error(`Backend failed after ${duration}ms`, backend.url);

        backendPool.markUnhealthy(backend.url);

        res.status(502).send("Bad gateway");
      }
    });
    return proxyMiddleware(req, res, next);
  };
}

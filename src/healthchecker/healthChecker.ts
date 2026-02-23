import { BackendPool } from "../balancer/pool.ts";
import { Logger } from "../utils/logger.ts";


export class HealthChecker {
  private intervalMs: number;
  private isRunning: boolean = false;
  private backendPool: BackendPool;  

  constructor(backendPool: BackendPool, intervalMs: number = 5000) {
    this.backendPool = backendPool;   
    this.intervalMs = intervalMs;
  }

  async checkAll() {
    const backends = this.backendPool.getAllBackends();

    const checks = backends.map(async (backend) => {
      try {
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 

        const res = await fetch(backend.url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          this.backendPool.markHealthy(backend.url);
          Logger.health(backend.url, true, `status: ${res.status}`);
        } else {
          this.backendPool.markUnhealthy(backend.url);
          Logger.health(backend.url, false, `status: ${res.status}`);
        }

      } catch (err) {
        this.backendPool.markUnhealthy(backend.url);
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        Logger.health(backend.url, false, errorMsg);
      }
    });

    await Promise.all(checks);
  }

  private async runLoop() {
    if (!this.isRunning) return;

    await this.checkAll();

    setTimeout(() => {
      this.runLoop();
    }, this.intervalMs);
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    
    this.checkAll().then(() => {
      this.runLoop();
    });
  }

  stop() {
    this.isRunning = false;
  }
}
import { BackendPool } from "../balancer/pool.ts";


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

    for (const backend of backends) {
      try {
        const res = await fetch(backend.url);

        if (res.ok) {
          this.backendPool.markHealthy(backend.url);
          console.log(`Healthy: ${backend.url}`);
        } else {
          this.backendPool.markUnhealthy(backend.url);
          console.log(`Unhealthy: ${backend.url}`);
        }

      } catch (err) {
        this.backendPool.markUnhealthy(backend.url);
        console.log(`Failed: ${backend.url}`);
      }
    }
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
    this.runLoop();
  }

  stop() {
    this.isRunning = false;
  }
}
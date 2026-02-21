import { type Backend } from "../types/types.ts"
import { BackendPool } from "./pool.ts";
import { RoundRobin } from "./roundRobin.ts";


export class LoadBalancer {
    constructor (
        private backendPool: BackendPool,
        private strategy: RoundRobin
    ){}

    pickBackend(): Backend {
        const healthyBackends = this.backendPool.getHealthyBackends();
        return this.strategy.pick(healthyBackends)
    }
}
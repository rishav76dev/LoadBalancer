import { type Backend } from "../types/types.ts"

export class BackendPool {
    private backends: Backend[];

    constructor(urls: string[]){
        this.backends = urls.map((url: string) => ({
            url, health:true
        }
        ))
    }

    getHealthyBackends() : Backend[] {
        return this.backends.filter(backend => backend.health);
    }

    markUnhealthy(url: string): void {
        const backend = this.backends.find(b => b.url === url);
        if(backend){
            backend.health = false
        }
    }

    markHealthy(url: string): void {
        const backend  = this.backends.find(b => b.url === url);
        if(backend){
            backend.health = true
        }
    }
}
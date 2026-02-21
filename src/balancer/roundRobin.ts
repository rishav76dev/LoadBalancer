import { type Backend } from "../types/types.ts"


export class RoundRobin {
    private index = 0; 

    pick (backends: Backend[]): Backend { 
        if (backends.length === 0){
            throw new Error(" No backend is available")
        }

        const backend = backends[this.index % backends.length]!;
        this.index++;

        return backend;
    }
}
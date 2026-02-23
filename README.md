# ⚖️ HTTP Load Balancer

A **Layer 7 HTTP Load Balancer** built from scratch in TypeScript using the Bun runtime. Distributes incoming traffic across multiple backend servers with automatic health checking, failover handling, and structured request logging.

> **Why I built this:** To deeply understand how production load balancers (like NGINX and HAProxy) work under the hood — request routing, health monitoring, and fault tolerance — by implementing one from first principles.

---

## Architecture

```
                         ┌─────────────────────┐
    Client Request ────▶ │   Express Server     │
                         │   (Port 3000)        │
                         └────────┬─────────────┘
                                  │
                         ┌────────▼─────────────┐
                         │   Load Balancer       │
                         │   (Round Robin)       │
                         └────────┬─────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼              ▼
              ┌──────────┐ ┌──────────┐  ┌──────────┐
              │ Backend 1│ │ Backend 2│  │ Backend 3│
              │ :3001    │ │ :3002    │  │ :3003    │
              └──────────┘ └──────────┘  └──────────┘
                    ▲             ▲              ▲
                    └─────────────┼──────────────┘
                         ┌───────┴──────────┐
                         │  Health Checker   │
                         │  (Every 5s)       │
                         └──────────────────┘
```

---

## Key Design Decisions

### Strategy Pattern for Load Balancing
The load balancing algorithm is decoupled from the core balancer via a strategy interface. Currently implements **Round Robin**, but the architecture makes it trivial to add Least Connections, Weighted Round Robin, or IP Hash — just implement a new strategy class and inject it.

### Parallel Health Checks with Timeouts
Health checks run concurrently using `Promise.all()` with per-request `AbortController` timeouts (3s). This prevents a single slow/dead backend from blocking health evaluation of the entire pool.

### Automatic Failover
When a backend fails during proxying, it is immediately marked unhealthy and removed from the rotation — no manual intervention needed. The health checker will re-add it once it recovers.

### Clean Separation of Concerns
Each module has a single responsibility:

| Module | Responsibility |
|---|---|
| `BackendPool` | Manages backend server registry and health state |
| `RoundRobin` | Implements the routing algorithm |
| `LoadBalancer` | Orchestrates strategy + pool to pick a backend |
| `ProxyHandler` | Forwards requests and handles proxy errors |
| `HealthChecker` | Periodically verifies backend availability |
| `Logger` | Structured, categorized log output |

---

## Project Structure

```
src/
├── index.ts                  # Entry point — wires all components together
├── balancer/
│   ├── loadBalancer.ts       # Core balancer: picks a healthy backend via strategy
│   ├── pool.ts               # Backend pool: tracks servers and their health status
│   └── roundRobin.ts         # Round Robin strategy implementation
├── healthchecker/
│   └── healthChecker.ts      # Periodic health checks with abort timeouts
├── proxy/
│   └── proxyHandler.ts       # Express middleware — reverse proxies to selected backend
├── types/
│   └── types.ts              # Shared TypeScript interfaces
└── utils/
    └── logger.ts             # Structured logging (request, response, health, error)
```

---

## How It Works

1. **Startup** — The load balancer initializes a pool of backend servers and starts periodic health checks.
2. **Incoming Request** — Express receives a request and passes it to the `ProxyHandler`.
3. **Backend Selection** — The `LoadBalancer` queries the `BackendPool` for healthy backends and uses the `RoundRobin` strategy to pick the next one.
4. **Proxying** — The request is forwarded to the selected backend via `express-http-proxy`. Response time is measured and logged.
5. **Error Handling** — If the backend fails, it is marked unhealthy immediately and a `502 Bad Gateway` is returned. If no backends are available, a `503 Service Unavailable` is returned.
6. **Health Recovery** — The `HealthChecker` runs every 5 seconds, pinging each backend. Recovered servers are automatically re-added to the healthy pool.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)

### Installation

```bash
git clone https://github.com/<your-username>/loadbalancer.git
cd loadbalancer
bun install
```

### Running the Load Balancer

```bash
# Start the load balancer (port 3000)
bun run start

# Or with hot reload during development
bun run dev
```

### Example: Spin Up Test Backends

You can use simple HTTP servers as test backends:

```bash
# Terminal 1
bun -e "Bun.serve({ port: 3001, fetch: () => new Response('Hello from 3001') })"

# Terminal 2
bun -e "Bun.serve({ port: 3002, fetch: () => new Response('Hello from 3002') })"

# Terminal 3
bun -e "Bun.serve({ port: 3003, fetch: () => new Response('Hello from 3003') })"
```

Then send requests to the load balancer:

```bash
# Requests are distributed across backends in round-robin order
curl http://localhost:3000
curl http://localhost:3000
curl http://localhost:3000
```

### Sample Log Output

```
INFO: Load balancer running on port 3000
INFO: Backend servers: http://localhost:3001, http://localhost:3002, http://localhost:3003
INFO: Health checker started (checking every 5s)
HEALTH: HEALTHY http://localhost:3001 - status: 200
HEALTH: HEALTHY http://localhost:3002 - status: 200
HEALTH: UNHEALTHY http://localhost:3003 - Connection refused
REQUEST: GET / -> http://localhost:3001
RESPONSE: GET / <- http://localhost:3001 [200] 12ms
REQUEST: GET / -> http://localhost:3002
RESPONSE: GET / <- http://localhost:3002 [200] 8ms
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **TypeScript** | Type-safe development with strict mode |
| **Bun** | Fast JavaScript runtime and package manager |
| **Express 5** | HTTP server framework |
| **express-http-proxy** | Reverse proxy middleware |

---

## Possible Extensions

- [ ] **Weighted Round Robin** — Assign capacity weights to backends
- [ ] **Least Connections** — Route to the backend with fewest active connections
- [ ] **IP Hash / Sticky Sessions** — Pin clients to specific backends
- [ ] **Rate Limiting** — Throttle requests per client IP
- [ ] **Admin Dashboard** — REST API to view pool status, toggle backends, and view metrics
- [ ] **Config File Support** — Load backend URLs and settings from a YAML/JSON config
- [ ] **Retry with Next Backend** — On failure, retry the request on a different backend before returning an error

---



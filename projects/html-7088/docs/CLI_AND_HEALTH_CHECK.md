# B2.st Mario HTML5 Game - Management CLI & Health Monitoring Subsystem

## Overview
This document specifies the technical architecture, operation guidelines, and REST/Prometheus monitoring endpoints for the **B2.st Super Mario HTML5 Game Engine**.

The management CLI (`src/cli.js`) and Telemetry Service (`src/core/health_monitor.js`) provide production-grade operations tooling:
- Local development static file server with real-time MIME streaming and caching headers.
- Health diagnostics with zero external runtime dependencies (pure Node.js ES6+).
- Level validation tools for ECS tilemaps and collision layers.
- Automated testing suite dispatcher.
- Kubernetes-compatible Liveness & Readiness probes.
- OpenMetrics / Prometheus standard scraping endpoint.

---

## 1. CLI Command Reference

Execute the CLI using `node src/cli.js <command> [options]` or `npm run <command>`:

| Command | Description | Default Options |
|---|---|---|
| `serve` | Boots the HTTP server and mounts the game & monitoring endpoints | `--port 3000`, `--host 127.0.0.1`, `--public ./public` |
| `health` | Prints real-time system and engine diagnostics to terminal | `--format table` (supports `json`, `prometheus`) |
| `test` | Runs all unit and integration tests across the test pipeline | None |
| `validate-level` | Validates tilemap JSON files, dimensions, collision matrices, and spawns | `--path src/levels` |
| `help` | Prints complete syntax guide and examples | None |
| `version` | Displays engine version | None |

### CLI Usage Examples:
```bash
# Start server on custom port
node src/cli.js serve -p 8080 --host 0.0.0.0

# Print JSON health report
node src/cli.js health --format json

# Query a running Mario game server remotely
node src/cli.js health --url http://127.0.0.1:3000/health

# Validate all level JSON structures
node src/cli.js validate-level

# Run all automated test suites
node src/cli.js test
```

---

## 2. Health Monitoring Endpoints

When the server is booted via `serve`, the following endpoints are served:

### `GET /health`
Returns full diagnostics including overall system status (`UP`, `DEGRADED`, or `DOWN`), process memory, event-loop lag, and individual component checks.

**HTTP Status Codes:**
- `200 OK`: Status is `UP` or `DEGRADED`.
- `503 Service Unavailable`: Status is `DOWN` (a critical check has failed).

**Response Schema:**
```json
{
  "status": "UP",
  "service": "b2st-mario-engine",
  "version": "1.0.0",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "uptimeSeconds": 142,
  "system": {
    "platform": "linux",
    "arch": "x64",
    "nodeVersion": "v20.10.0",
    "cpuCount": 8,
    "osLoadAverage": [0.12, 0.08, 0.05],
    "freeMemoryBytes": 8589934592,
    "totalMemoryBytes": 17179869184,
    "processMemory": {
      "heapUsedBytes": 32505856,
      "heapTotalBytes": 45613056,
      "rssBytes": 67108864
    },
    "eventLoopLagMs": 1.12
  },
  "engine": {
    "activeEntities": 24,
    "tickRateFps": 60.0,
    "tickLatencyMs": 0.85,
    "physicsCollisionsCount": 112,
    "droppedFrames": 0,
    "levelName": "world-1-1"
  },
  "checks": {
    "memory": {
      "status": "UP",
      "critical": false,
      "durationMs": 0.45,
      "message": "Memory usage within nominal boundaries"
    },
    "eventLoop": {
      "status": "UP",
      "critical": false,
      "durationMs": 0.21,
      "message": "Event loop execution latency optimal"
    }
  }
}
```

---

### `GET /health/liveness`
Fast, lightweight probe checking if the Node.js event loop and process are alive.

```json
{
  "status": "UP",
  "service": "b2st-mario-engine",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "uptimeSeconds": 142
}
```

---

### `GET /health/readiness`
Checks readiness of critical game systems (tile assets, level caches, physics pipeline). Returns `503` if any critical dependency is unavailable.

```json
{
  "status": "UP",
  "ready": true,
  "timestamp": "2025-01-01T12:00:00.000Z",
  "failures": []
}
```

---

### `GET /metrics`
Exposes system and engine telemetry in standard OpenMetrics / Prometheus exposition format for Grafana / Prometheus scrapers:

```text
# HELP process_uptime_seconds Total runtime of the Mario game engine server in seconds.
# TYPE process_uptime_seconds counter
process_uptime_seconds 142

# HELP b2st_mario_health_status Overall health indicator (1 = UP, 0.5 = DEGRADED, 0 = DOWN).
# TYPE b2st_mario_health_status gauge
b2st_mario_health_status 1

# HELP nodejs_heap_size_used_bytes Process heap memory currently used in bytes.
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 32505856

# HELP mario_engine_active_entities Number of currently active entities in the game world.
# TYPE mario_engine_active_entities gauge
mario_engine_active_entities 24

# HELP mario_engine_tick_latency_milliseconds Mean latency of game simulation frame ticks.
# TYPE mario_engine_tick_latency_milliseconds gauge
mario_engine_tick_latency_milliseconds 0.850
```

---

## 3. Kubernetes Deployment Probes Example

```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 3
  periodSeconds: 5
```
# Platform Module

## Scope

The Platform module owns the combined service boundary, health checks,
deployment, runtime configuration, index administration, and operational
expectations.

Implementation:

- `combined_app.py`
- `Dockerfile`
- `deployment/deploy.sh`
- `deployment/gunicorn_combined.conf.py`
- `scripts/dev/run_local.sh`

## Service layout

One FastAPI/ASGI service exposes:

- Agent Core at `/agent/*`;
- Recsys Core at `/api/v1/*` and `/` through the mounted Flask WSGI app;
- FastAPI OpenAPI at `/openapi.json`, Swagger at `/docs`, and ReDoc at `/redoc`;
- combined health at `/health`.

## Health endpoints

### `GET /health`

Returns combined service mode, Agent configuration/model/prompt version,
Recsys grounding availability, and the Recsys health path.

### `GET /api/v1/health`

Returns Mongo and Redis connectivity, FAISS index size/memory, and ranker load
state. Mongo failure returns HTTP `500`. Redis disconnection is reported but
does not make the endpoint unhealthy; feed pagination and caches then degrade.

Clients should use `/health` for readiness. Operators should inspect both.

## Admin endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/admin/index/refresh` | Start a non-blocking catalog/FAISS rebuild. |
| `POST /api/v1/admin/ranker/reload` | Reload the configured ranker artifact. |

Both require `X-API-Key` matching `ADMIN_API_KEY`. Never call them from a public
client. Index refresh returns HTTP `409` while a rebuild is already running.

## Local run

```bash
python3 -m pip install -r requirements.txt
./scripts/dev/run_local.sh
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/health
```

Use `RELOAD=true ./scripts/dev/run_local.sh` only for development; reload can
initialize the catalog more than once.

## Cloud Run deployment

`deployment/deploy.sh` builds the container in Artifact Registry and deploys one
Cloud Run service. It requires Secret Manager names for MongoDB, the admin API
key, and the Juno Agent token. Optional Redis, Google, and Gemini secrets are
attached when configured. Use `REDIS_HOST_SECRET`, `REDIS_PORT_SECRET`, and
`REDIS_PASSWORD_SECRET` for production Redis values; direct `REDIS_*` values
remain available for local development.

The project-root `deploy.sh` targets `juno-ai-recsys` directly and always maps
its Redis variables to the provisioned Secret Manager secrets. Do not replace
those variables with `--set-env-vars` on an existing production service.

The deployment defaults to one Gunicorn worker so each instance loads one FAISS
catalog. Scale with Cloud Run instances before increasing workers and
duplicating the in-memory index.

Required production relationships:

- Cloud Run, MongoDB, and Redis should be regionally close;
- private Redis requires the configured VPC connector;
- `DEMO_MODE` must be false;
- `MIN_INSTANCES=1` avoids a fully cold service;
- secrets belong in Secret Manager, not tracked scripts or environment files.

## Core environment variables

| Area | Variables |
| --- | --- |
| Catalog | `MODEL_NAME`, `EMBEDDING_MODEL_VERSION`, `EMBEDDING_DIM`, `VISUAL_EMBEDDING_DIM` |
| Data | `MONGODB_URI`, `MONGODB_DB`, `AI_DATABASE_NAME` |
| Cache | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`; production secret names: `REDIS_HOST_SECRET`, `REDIS_PORT_SECRET`, `REDIS_PASSWORD_SECRET` |
| Agent | `GEMINI_API_KEY`, `AGENT_ENABLED`, `AGENT_*` limits |
| Upstream | `JUNOAPI_BASE_URL`, `JUNO_AGENT_TOKEN` |
| Runtime | `PORT`, `GUNICORN_WORKERS`, `GUNICORN_PRELOAD`, `LOG_LEVEL` |

## Operational checks

- health endpoints return HTTP `200`;
- Redis reports connected in production;
- FAISS size matches the active encoded catalog;
- ranker state is intentional;
- warm request latency and response size stay within the current performance
  budget;
- index refresh serves the prior index until the atomic replacement completes.

Update this file whenever routing, health, deployment, secrets, scaling,
runtime configuration, admin operations, or service ownership changes.

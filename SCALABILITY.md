# ShambaLoop scalability notes

## Current architecture

ShambaLoop currently runs as one Express process with a Vite-served React client in development. `server.ts` reads and writes `data/db.json` synchronously. Audit records are appended to `data/audit_log.json`. The process owns in-memory OTP and rate-limit registries. Farmer proposals, farm events, veterinary jobs, veterinary reports, and investor opportunity briefs use the same JSON store. Uploaded files and external payment processing are not implemented as durable services in this codebase.

## Current constraints

- A JSON file is loaded and rewritten by one process; concurrent writers can overwrite each other and multiple instances do not share state. This now includes farmer proposals, farm events, veterinary jobs, reports, and investor opportunity briefs.
- Synchronous file I/O and JSON aggregation make API latency proportional to data size.
- OTP state and rate-limit buckets are lost on restart and are not coordinated between instances.
- Audit records are local files with no retention, query, tamper-evidence, or alerting service.
- The React client currently loads collections into application state; larger queues will need pagination and server-side filtering.

## Database scaling

The next persistence target should be PostgreSQL. Model users, listings, verification requests and decisions, agreements, partnerships, matches, disputes, transactions, refresh tokens, and audit events as normalized tables. Add foreign keys and indexes for:

- role and verified state on users;
- moderation status and creation time on listings;
- status and submission time on verification requests;
- agreement/partnership IDs and status on disputes;
- participant IDs and status on matches.

Use transactions for a dispute resolution and its escrow-state change. Store KYC document references separately from queue metadata and apply strict access auditing to the decrypted view.

## API scaling

Keep the current route boundaries while splitting Express routers by domain when the server grows. Add cursor pagination to administrative queues and public listings, bounded search parameters, API request IDs in structured logs, and OpenAPI contracts. Put authorization in reusable middleware and resource-policy functions so new routes cannot bypass RBAC.

## Frontend scaling

The dashboards keep compact, decision-oriented views. When collections become large, fetch paginated tables on demand, debounce farmer/listing search, and invalidate only the affected query after a decision. Keep private farm monitoring server-filtered and avoid returning KYC detail in list endpoints. Existing client state can remain the integration layer until independent data fetching is justified.

## Caching

Public, approved listings can be cached at a CDN with short revalidation. Do not shared-cache authenticated admin data, KYC, disputes, profile data, or action responses. After moving to PostgreSQL, use Redis for short-lived rate-limit counters, OTP challenges, and explicitly scoped read-through cache entries; key caches by tenant/user authorization context where needed.

## Background processing and storage

The current process has no job worker. Introduce a queue only for durable asynchronous work such as payment callback reconciliation, notification delivery, document scanning, and report generation. Use object storage for document and evidence files; store opaque object keys and metadata in the database, use short-lived signed URLs, malware scanning, lifecycle rules, and encryption at rest.

## Horizontal scaling

Horizontal scaling is unsafe with the JSON store and in-memory state. After externalizing PostgreSQL, Redis, object storage, and job processing, Express instances can be stateless and run behind a load balancer. Payment webhooks need idempotency keys and database-backed deduplication before scaling workers.

## Observability

Keep the current correlation ID and structured request logs, then ship logs centrally. Add metrics for request duration/error rate, authorization failures, queue age, KYC decisions, listing moderation, dispute resolution time, transaction reconciliation, database pool saturation, worker failures, and cache performance. Alert on access-control errors and failed audit writes.

## Security while scaling

Use a managed secrets store and rotate JWT, refresh-token, and encryption keys. Enforce TLS from the edge to the application, rate-limit at the edge and Redis layer, protect administrative routes with MFA and stronger session controls, and retain immutable audit logs in access-controlled storage. Backups must be encrypted and tested for restoration. Apply least-privilege database and object-storage credentials to each service.

## Recommended stages

1. **Stabilize the current deployment:** configure non-default secrets, HTTPS, production CORS, backups, and centralized logs.
2. **Move persistence:** migrate JSON data to PostgreSQL and audit files to an append-only audit table or log service; add pagination and indexes.
3. **Externalize state:** add Redis for rate limits and OTPs, object storage for evidence/documents, and a queue for callbacks and notifications.
4. **Scale services:** run stateless API replicas and workers behind a load balancer with observability, idempotency, and disaster-recovery exercises.

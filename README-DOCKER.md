Dockerized microservices + Traefik gateway

Prereqs
- Docker + Docker Compose installed
- Add hosts entries:
  127.0.0.1 auth.localhost consult.localhost patient.localhost doctor.localhost billing.localhost

Build & Run
- docker compose up -d --build
- Open:
  - Auth:    http://auth.localhost
  - Consult: http://consult.localhost
  - Patient: http://patient.localhost
  - Doctor:  http://doctor.localhost
  - Billing: http://billing.localhost
- Traefik dashboard: http://localhost:80/dashboard/

Envs (compose)
- Each service uses a Mongo on `mongo` and Redis on `redis` where relevant
- CORS origins are set to local hosts; adjust as needed

Uploads
- Consultation uploads stored in a named volume `consult_uploads`

Notes
- For HTTPS in front, you can add Traefik TLS configuration and certificates; current setup is HTTP for local dev
- Swagger may be available depending on each service’s envs


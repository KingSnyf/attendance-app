Endpoints exposés (scaffold rapide):

- POST /api/auth/login  { email, password }
- POST /api/auth/users  { email, firstName?, lastName?, role? }
- GET  /api/auth/users/:id
- POST /api/sessions/checkin { userId, deviceId?, method? }
- POST /api/sessions/checkout { userId, deviceId? }
- GET  /api/sessions/:userId
- GET  /api/settings
- PUT  /api/settings
- GET  /api/anomalies

Ces endpoints utilisent un stockage en mémoire pour le prototype. Pour production, branchez Prisma et PostgreSQL.

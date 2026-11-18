export const SAMPLE_EXAMPLE = `# App
NODE_ENV=development
PORT=3000
APP_NAME="Envguard"

# Database
DATABASE_URL=postgres://user:password@localhost:5432/envguard
DATABASE_POOL_SIZE=10

# Auth
JWT_SECRET=replace-with-a-long-random-string
SESSION_COOKIE_NAME=envguard_session

# Services
STRIPE_SECRET_KEY=
RESEND_API_KEY=
SENTRY_DSN=
`;

export const SAMPLE_ENV = `# Local overrides - never commit this file.

export NODE_ENV=development
PORT=3000          # first definition, removed by "Copy fixed .env"
PORT=4000
APP_NAME='Envguard local'

DATABASE_URL=postgres://user:password@localhost:5432/envguard
# DATABASE_POOL_SIZE is not set yet

JWT_SECRET=dev-only-secret-please-change
SESSION_COOKIE_NAME=envguard_session

STRIPE_SECRET_KEY=
RESEND_API_KEY=re_sample_123
SENTRY_DSN=

# Debugging
DEBUG=true
`;

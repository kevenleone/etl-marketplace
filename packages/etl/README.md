# ETL Package

This package handles the Extract, Transform, and Load (ETL) processes for the Marketplace project. It is responsible for data migration, synchronization, and automation tasks.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Language**: TypeScript
- **Database**: mysql2 (via Prisma)
- **Headless Client**: liferay-headless-rest-client
- **Scraping**: Puppeteer
- **Validation**: Zod

## Getting Started

### Prerequisites

- Bun installed
- MySQL database running
- `.env` file configured (see [Configuration](#configuration))

### Installation

```bash
bun install
```

### Database Setup

```bash
# Generate Prisma Client
bun run prisma generate

# Push schema to database
bun run prisma db push
```

## Structure

- **`src/config`**: Configuration files and environment variable definitions.
- **`src/services`**: Core business logic and API interactions (Liferay, Marketplace).
- **`src/utils`**: Helper functions for logging, caching, and file handling.
- **`src/scripts`**: Executable scripts for specific ETL tasks.

## Scripts

You can run scripts using `bun run <script_name>`. Common scripts include:

- **`migrate-product-versions.ts`**: Migrates product version data.
- **`create-product-from-json.ts`**: Imports products from JSON files.
- **`update-notification.templates.ts`**: Updates Liferay notification templates based on the `email` package.
- **`export-product.ts`**: Exports product data to files.
- **`check-expando-data.ts`**: Verifies expando field data.

See `src/scripts` for the full list of available automations.

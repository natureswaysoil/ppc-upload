# Cloud Run Deployment – Dashboard Service

The dashboard lives in `services/dashboard` (Next.js 14). This README captures the build and deployment steps for Google Cloud Run.

## 1. Build and push the container image

```bash
PROJECT_ID=amazon-ppc-474902
REGION=us-east4
IMAGE=nextjs-dashboard
TAG=version_2

cd services/dashboard
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --tag "gcr.io/${PROJECT_ID}/${IMAGE}:${TAG}"
```

## 2. Runtime environment variables

Provide the following Cloud Run variables (values depend on your deployment). As with the optimizer, store sensitive values in Google Secret Manager and attach them at deploy time.

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Prisma-compatible connection string for the production database |
| `NEXTAUTH_URL` | External URL for the deployed dashboard |
| `NEXTAUTH_SECRET` | 32-byte secret (generate with `openssl rand -base64 32`) |
| `AMAZON_CLIENT_ID` | (Optional) Amazon Advertising credentials for synchronous calls |
| `AMAZON_CLIENT_SECRET` | " |
| `AMAZON_REFRESH_TOKEN` | " |
| `AMAZON_PROFILE_ID` | " |
| `NODE_ENV` | Automatically set to `production` by the image |

Store sensitive values in Secret Manager and mount them as environment variables or volumes; never rely on the sample `.env` file which ships with placeholder secrets.

## 3. Deploy the Cloud Run service

```bash
SERVICE=nextjs-dashboard
IMAGE_URI="gcr.io/${PROJECT_ID}/${IMAGE}:${TAG}"
SERVICE_ACCOUNT=dashboard-runner@${PROJECT_ID}.iam.gserviceaccount.com

gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE_URI}" \
  --cpu 1 \
  --memory 512Mi \
  --port 8080 \
  --execution-environment default \
  --max-instances 20 \
  --min-instances 0 \
  --timeout 300 \
  --concurrency 80 \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-secrets DATABASE_URL=projects/${PROJECT_ID}/secrets/ppc_dashboard_database_url:latest \
  --set-env-vars NEXTAUTH_URL="$NEXTAUTH_URL" \
  --set-secrets NEXTAUTH_SECRET=projects/${PROJECT_ID}/secrets/ppc_dashboard_nextauth_secret:latest \
  --set-secrets AMAZON_CLIENT_ID=projects/${PROJECT_ID}/secrets/amazon_client_id:latest \
  --set-secrets AMAZON_CLIENT_SECRET=projects/${PROJECT_ID}/secrets/amazon_client_secret:latest \
  --set-secrets AMAZON_REFRESH_TOKEN=projects/${PROJECT_ID}/secrets/amazon_refresh_token:latest \
  --set-secrets AMAZON_PROFILE_ID=projects/${PROJECT_ID}/secrets/amazon_profile_id:latest \
  --allow-unauthenticated
```

If the service should be private, omit `--allow-unauthenticated` and grant `roles/run.invoker` to the identities that need access (load balancer, IAP, etc.).

> Update the `projects/.../secrets/...` handles to match the exact Secret Manager entries that already store your production values.

## 4. Database migrations & Prisma

After deployment, run migrations from a Cloud Run job or Cloud Shell:

```bash
cd services/dashboard
npx prisma migrate deploy
```

Or use a one-off Cloud Run job pointing to the same image:

```bash
gcloud beta run jobs create dashboard-migrate \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE_URI}" \
  --set-env-vars DATABASE_URL="$DATABASE_URL" \
  --command "npx" --args "prisma","migrate","deploy"
```

## 5. BigQuery integration from the dashboard

The Next.js application already includes BigQuery utility hooks. To add a new API route that queries BigQuery, follow this template:

```ts
// app/api/analytics/bigquery/route.ts
import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

export async function GET() {
  const client = new BigQuery();
  const [rows] = await client.query({
    query: "SELECT * FROM `amazon-ppc-474902.amazon_ppc.metrics` LIMIT 100",
  });
  return NextResponse.json(rows);
}
```

Grant the dashboard service account `roles/bigquery.dataViewer` on the dataset to make the query succeed. Store service account credentials in Secret Manager if using key-based auth; otherwise attach a workload identity to the service account.

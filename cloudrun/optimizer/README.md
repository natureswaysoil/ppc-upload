# Cloud Run Deployment – Optimizer Service

This directory documents how to build and deploy the Amazon PPC optimizer as a Cloud Run service. The runtime lives in `services/optimizer` and exposes two endpoints:

- `GET /healthz` – readiness probe used by Cloud Run
- `POST /run` – executes a single optimizer pass

## 1. Build and push the container image

```bash
PROJECT_ID=amazon-ppc-474902
REGION=us-east4
REPO=gcf-artifacts
IMAGE=amazon--ppc--optimizer
TAG=version_2

cd services/optimizer
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE}:${TAG}"
```

> The Artifact Registry repository `gcf-artifacts` already exists (used by the existing revision). The new tag `version_2` creates a fresh immutable revision.

## 2. Required environment variables

Set the following as **Cloud Run service variables** (never bake credentials into the image). Store sensitive values in Google Secret Manager, then map them to environment variables during deployment as shown in the next section.

| Variable | Description |
| --- | --- |
| `AMAZON_CLIENT_ID` | Amazon Advertising API client ID |
| `AMAZON_CLIENT_SECRET` | Amazon Advertising API client secret |
| `AMAZON_REFRESH_TOKEN` | OAuth refresh token |
| `PPC_PROFILE_ID` | Default profile ID when requests omit `profile_id` |
| `PPC_CONFIG_PATH` | Optional alternate config path (defaults to `config.yaml`) |
| `PPC_DRY_RUN` | Set to `true` to make dry runs the default |
| `BIGQUERY_TABLE` | Optional: `project.dataset.table` for audit logging |

The container expects the config at `/opt/app/config.yaml` (copied from the repo). Overwrite the config via Cloud Storage or Secret Manager if you need environment-specific parameters.

> If you prefer not to inject secret values directly as environment variables, set `<VARIABLE>_SECRET` instead (for example, `AMAZON_CLIENT_ID_SECRET=amazon_client_id`). The service will resolve the secret at runtime using Google Secret Manager.

## 3. Service deployment command

```bash
SERVICE=amazon-ppc-optimizer
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE}:${TAG}"
SERVICE_ACCOUNT=optimizer-runner@${PROJECT_ID}.iam.gserviceaccount.com

gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE_URI}" \
  --cpu 1 \
  --memory 1Gi \
  --port 8080 \
  --execution-environment default \
  --max-instances 20 \
  --min-instances 0 \
  --timeout 540 \
  --concurrency 1 \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-secrets AMAZON_CLIENT_ID=projects/${PROJECT_ID}/secrets/amazon_client_id:latest \
  --set-secrets AMAZON_CLIENT_SECRET=projects/${PROJECT_ID}/secrets/amazon_client_secret:latest \
  --set-secrets AMAZON_REFRESH_TOKEN=projects/${PROJECT_ID}/secrets/amazon_refresh_token:latest \
  --set-secrets PPC_PROFILE_ID=projects/${PROJECT_ID}/secrets/amazon_profile_id:latest \
  --set-env-vars PPC_CONFIG_PATH=config.yaml \
  --set-env-vars PPC_DRY_RUN=false \
  --set-env-vars BIGQUERY_TABLE="${PROJECT_ID}.amazon_ppc.optimizer_runs" \
  --allow-unauthenticated
```

* Remove `--allow-unauthenticated` if the service should be private (recommended for production). Grant `roles/run.invoker` to Cloud Scheduler or other callers instead.
* Replace the `projects/.../secrets/...` values with the actual secret resource names that already hold your stored credentials in Google Secret Manager.

## 4. Optional BigQuery audit log

When `BIGQUERY_TABLE` is set, the service writes one JSON row per run:

| Column | Type | Description |
| --- | --- | --- |
| `profile_id` | STRING | The Amazon profile that was optimized |
| `dry_run` | BOOL | Indicates whether the request ran in dry-run mode |
| `features` | STRING | Comma-separated list of features executed |
| `results_json` | JSON/STRING | Serialized outcome returned by the optimizer |
| `run_timestamp` | TIMESTAMP | UTC timestamp of the run |

Example table creation:

```sql
CREATE TABLE `amazon-ppc-474902.amazon_ppc.optimizer_runs` (
  profile_id STRING,
  dry_run BOOL,
  features STRING,
  results_json JSON,
  run_timestamp TIMESTAMP
);
```

Grant the Cloud Run service account `roles/bigquery.dataEditor` on the dataset so inserts succeed.

> The existing Transfer Service configuration (`amazon-ppc`, every 2 hours into dataset `amazon_ppc`) continues to populate the dataset; the optimizer log table simply augments that data stream.

## 5. Scheduler trigger (optional)

Use Cloud Scheduler → Pub/Sub → Cloud Run to run every two hours:

1. Create a Pub/Sub topic `optimizer-run`.
2. Create a push subscription targeted at the Cloud Run URL.
3. Create a scheduler job:
   ```bash
   gcloud scheduler jobs create pubsub optimizer-two-hourly \
     --project "${PROJECT_ID}" \
     --location "${REGION}" \
     --schedule "0 */2 * * *" \
     --time-zone "America/New_York" \
     --topic optimizer-run \
     --message-body '{"dry_run": false}'
   ```
4. Grant the scheduler service account `roles/pubsub.publisher` and `roles/run.invoker` as needed.

## 6. Health checks

The service exposes `/healthz` for the TCP startup probe defined in Cloud Run. Keep the startup probe configuration (`tcp 8080 every 240s`) from the UI when editing revisions.

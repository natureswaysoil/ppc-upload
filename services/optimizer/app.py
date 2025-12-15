"""HTTP wrapper for the Amazon PPC optimizer.

Exposes lightweight health and execution endpoints so the optimizer can run
inside Google Cloud Run. Requests should provide the Amazon profile ID and
optional overrides for config path, features, and dry-run settings.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Iterable, List, Optional

import requests

from flask import Flask, jsonify, request

from amazon_ppc_optimizer import PPCAutomation

try:  # Optional BigQuery logging
    from google.cloud import bigquery  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    bigquery = None

app = Flask(__name__)

logger = logging.getLogger(__name__)


def _parse_features(raw: Optional[Iterable[str]]) -> Optional[List[str]]:
    """Cast incoming feature lists to the expected format."""
    if raw is None:
        return None
    if isinstance(raw, (list, tuple, set)):
        return [str(item) for item in raw if str(item).strip()]
    return [part.strip() for part in str(raw).split(",") if part.strip()]


def _as_bool(value, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "t", "yes", "y"}


DEFAULT_CONFIG_PATH = os.environ.get("PPC_CONFIG_PATH", "config.yaml")
# Resolve default profile ID from env or common secret names
DEFAULT_PROFILE_ID = os.environ.get("AMAZON_PROFILE_ID")
DEFAULT_DRY_RUN = _as_bool(os.environ.get("PPC_DRY_RUN"), False)
BIGQUERY_TABLE = os.environ.get("BIGQUERY_TABLE")


def _insert_bigquery_row(profile_id: str, dry_run: bool, features: Optional[List[str]], results):
    """Persist execution metadata to BigQuery when configured."""
    if not BIGQUERY_TABLE or bigquery is None:
        return

    client = bigquery.Client()
    row = {
        "profile_id": profile_id,
        "dry_run": dry_run,
        "features": ",".join(features or []),
        "results_json": json.dumps(results, default=str),
        "run_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    errors = client.insert_rows_json(BIGQUERY_TABLE, [row])  # type: ignore[arg-type]
    if errors:  # pragma: no cover - defensive logging only
        logger.error("Failed to write optimizer run to BigQuery: %s", errors)


@app.get("/healthz")
def healthcheck():
    """Simple readiness probe."""
    return jsonify({"status": "ok"})


@app.get("/")
def root():
    """Root path for quick checks and Cloud Run default route."""
    return jsonify({"status": "ok", "message": "amazon-ppc-optimizer"})


@app.get("/health")
def health_alias():
    """Alias to healthz for compatibility."""
    return jsonify({"status": "ok"})


@app.post("/run")
def run_optimizer():
    """Trigger a single optimizer execution."""
    payload = request.get_json(force=False, silent=True) or {}

    config_path = payload.get("config_path") or payload.get("configPath") or DEFAULT_CONFIG_PATH
    profile_id = (
        payload.get("profile_id")
        or payload.get("profileId")
        or payload.get("profile")
        or DEFAULT_PROFILE_ID
    )
    features = _parse_features(payload.get("features"))
    dry_run = _as_bool(payload.get("dry_run") or payload.get("dryRun"), DEFAULT_DRY_RUN)

    if not config_path or not os.path.exists(config_path):
        return (
            jsonify({
                "error": "config_not_found",
                "message": f"Config file '{config_path}' is missing. Override with config_path or PPC_CONFIG_PATH.",
            }),
            400,
        )

    if not profile_id:
        return (
            jsonify({
                "error": "missing_profile_id",
                "message": "Provide profile_id in the request body or set PPC_PROFILE_ID.",
            }),
            400,
        )

    started_at = time.time()

    try:
        automation = PPCAutomation(config_path, str(profile_id), dry_run)
        results = automation.run(features)
    except SystemExit as exc:  # Underlying script uses sys.exit on fatal errors
        logger.exception("Optimizer exited early with status %s", exc.code)
        return (
            jsonify({
                "error": "optimizer_exit",
                "message": "Optimizer exited early. Check logs for details.",
                "status_code": exc.code,
            }),
            500,
        )
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Optimizer run failed")
        return (
            jsonify({
                "error": "optimizer_failure",
                "message": str(exc),
            }),
            500,
        )

    runtime_seconds = time.time() - started_at

    try:
        _insert_bigquery_row(str(profile_id), dry_run, features, results)
    except Exception as exc:  # pragma: no cover - logging only
        logger.exception("BigQuery logging failed: %s", exc)

    return jsonify({
        "status": "completed",
        "dry_run": dry_run,
        "features": features,
        "runtime_seconds": runtime_seconds,
        "results": results,
    })


# Alias endpoint expected by some clients
@app.post("/optimize")
def optimize_alias():
    return run_optimizer()


@app.get("/check-oauth")
def check_oauth():
    """Preflight check: validates Amazon LWA token exchange with current env.

    Returns detailed diagnostics without running the optimizer.
    """
    client_id = os.environ.get("AMAZON_CLIENT_ID")
    client_secret = os.environ.get("AMAZON_CLIENT_SECRET")
    refresh_token = os.environ.get("AMAZON_REFRESH_TOKEN")

    missing = [k for k, v in {
        "AMAZON_CLIENT_ID": client_id,
        "AMAZON_CLIENT_SECRET": client_secret,
        "AMAZON_REFRESH_TOKEN": refresh_token,
    }.items() if not v]

    if missing:
        return jsonify({
            "status": "error",
            "error": "missing_env",
            "missing": missing,
            "message": "Missing required environment variables bound from Secret Manager.",
        }), 400

    try:
        resp = requests.post(
            "https://api.amazon.com/auth/o2/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
            },
            timeout=30,
        )
        ok = resp.ok
        content_type = resp.headers.get("content-type", "")
        body = None
        try:
            body = resp.json()
        except Exception:
            body = resp.text

        return jsonify({
            "status": "ok" if ok else "error",
            "http_status": resp.status_code,
            "content_type": content_type,
            "response": body,
        }), (200 if ok else 502)
    except requests.RequestException as e:
        return jsonify({
            "status": "error",
            "error": "request_exception",
            "message": str(e),
        }), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

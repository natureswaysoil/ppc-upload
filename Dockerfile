FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install unzip and clean apt cache
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*

# Copy repository
COPY . /app

# Unzip any zip archives into folders named after the zip (without extension)
RUN for z in /app/*.zip; do \
      if [ -f "$z" ]; then \
        d="/app/$(basename "$z" .zip)"; \
        mkdir -p "$d"; \
        unzip -o "$z" -d "$d" || true; \
      fi; \
    done

# Install Python dependencies if requirements.txt exists
RUN pip install --upgrade pip
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Default cmd - run verification script by default. Users can override to run other scripts.
CMD ["python", "verify_repository.py"]

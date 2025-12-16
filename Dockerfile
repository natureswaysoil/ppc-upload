FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*
COPY . /app
RUN for z in /app/*.zip; do \
      if [ -f "$z" ]; then \
        d="/app/$(basename "$z" .zip)"; \
        mkdir -p "$d"; \
        unzip -o "$z" -d "$d" || true; \
      fi; \
    done
RUN pip install --upgrade pip
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
CMD ["python", "verify_repository.py"]
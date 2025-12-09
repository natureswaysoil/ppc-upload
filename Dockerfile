# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy repository files
COPY . /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Unzip all repository ZIP files during build
RUN mkdir -p /app/extracted && \
    for zipfile in *.zip; do \
        if [ -f "$zipfile" ]; then \
            echo "Extracting $zipfile..."; \
            if ! unzip -q "$zipfile" -d "/app/extracted/$(basename "$zipfile" .zip)"; then \
                echo "Warning: Failed to extract $zipfile"; \
            fi; \
        fi \
    done

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose port for Cloud Run
EXPOSE 8080

# Default command - run verification script
CMD ["python", "verify_repository.py"]

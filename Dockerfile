FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY core/requirements.txt .
COPY dashboard/requirements.txt dashboard_reqs.txt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r dashboard_reqs.txt && \
    pip install python-multipart

# Copy source code
COPY core/ ./core/
COPY dashboard/ ./dashboard/
COPY adapters/ ./adapters/
COPY .env .

# Expose port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "dashboard.server:app", "--host", "0.0.0.0", "--port", "8000"]

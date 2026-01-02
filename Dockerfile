FROM python:3.11-slim

WORKDIR /app
ENV PYTHONPATH=/app

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

# Expose port
EXPOSE 8000

# Run the server using the PORT environment variable provided by Railway (default 8000)
CMD ["python", "dashboard/server.py"]

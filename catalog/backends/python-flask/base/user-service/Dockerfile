FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV DD_LOGS_INJECTION=true
CMD ["ddtrace-run", "python", "app.py"]

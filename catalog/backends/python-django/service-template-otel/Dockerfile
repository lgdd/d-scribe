FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN opentelemetry-bootstrap -a install
COPY . .
CMD ["opentelemetry-instrument", "gunicorn", "app.wsgi:application", "-b", "0.0.0.0:8080"]

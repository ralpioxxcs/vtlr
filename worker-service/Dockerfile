FROM python:3.10-slim

WORKDIR /worker

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . /worker

CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info"]

FROM python:3.10-slim

WORKDIR /worker

COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

RUN python -m unidic download

COPY . /worker

CMD ["python", "worker.py"]

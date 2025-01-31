from rq import Worker, Queue
from redis import Connection, Redis
from dotenv import load_dotenv

import os

load_dotenv()

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
redis_port = os.getenv('REDIS_PORT', '6379')

if __name__ == '__main__':
  redis_conn = Redis(host=redis_host, port=int(redis_port), db=0)
  queue = Queue(connection=redis_conn)
  worker = Worker([queue])
  worker.work()

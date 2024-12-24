from rq import Worker, Queue
from redis import Redis
from dotenv import load_dotenv

import os

load_dotenv()

redis_host=os.getenv('REDIS_HOST', '127.0.0.1')
redis_port=os.getenv('REDIS_PORT', '6379')

redis_conn = Redis(host=redis_host, port=int(redis_port), db=0)

if __name__ == '__main__':
    worker = Worker([Queue(connection=redis_conn)])
    worker.work()

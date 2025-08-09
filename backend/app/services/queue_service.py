import redis
import json
from celery import Celery
from typing import Dict, Any

# Redis Queue Setup
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Celery Setup
celery_app = Celery(
    'model_generation',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

@celery_app.task
def process_model_generation(generation_data: Dict[str, Any]):
    """Celery task for model generation"""
    return process_3d_generation(**generation_data)

class QueueService:
    def __init__(self):
        self.redis = redis_client
        self.celery = celery_app
    
    async def add_generation_job(self, generation_id: str, job_data: Dict[str, Any]):
        """Add generation job to queue"""
        job = self.celery.send_task(
            'process_model_generation',
            args=[job_data],
            task_id=generation_id
        )
        return job.id
    
    async def get_job_status(self, generation_id: str):
        """Get job status from queue"""
        job = self.celery.AsyncResult(generation_id)
        return {
            "status": job.status,
            "progress": job.info.get('progress', 0) if job.info else 0,
            "result": job.result if job.successful() else None
        }
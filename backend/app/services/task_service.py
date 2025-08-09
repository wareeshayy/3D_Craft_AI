import asyncio
from typing import Dict, Any, Callable
import json
import time
from datetime import datetime

class SimpleTaskManager:
    def __init__(self):
        self.tasks = {}  # task_id -> task_info
        self.running_tasks = {}  # task_id -> asyncio.Task
    
    async def add_task(self, task_id: str, task_func: Callable, **kwargs) -> str:
        """Add a background task"""
        
        self.tasks[task_id] = {
            'id': task_id,
            'status': 'pending',
            'progress': 0,
            'started_at': datetime.utcnow().isoformat(),
            'completed_at': None,
            'error': None,
            'result': None
        }
        
        # Start the task
        task = asyncio.create_task(self._run_task(task_id, task_func, **kwargs))
        self.running_tasks[task_id] = task
        
        return task_id
    
    async def _run_task(self, task_id: str, task_func: Callable, **kwargs):
        """Run a task with progress tracking"""
        
        try:
            self.tasks[task_id]['status'] = 'running'
            
            # Run the actual task
            result = await task_func(task_id, **kwargs)
            
            # Mark as completed
            self.tasks[task_id].update({
                'status': 'completed',
                'progress': 100,
                'completed_at': datetime.utcnow().isoformat(),
                'result': result
            })
            
        except Exception as e:
            self.tasks[task_id].update({
                'status': 'failed',
                'error': str(e),
                'completed_at': datetime.utcnow().isoformat()
            })
        
        finally:
            # Cleanup
            if task_id in self.running_tasks:
                del self.running_tasks[task_id]
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get task status"""
        return self.tasks.get(task_id, {'status': 'not_found'})
    
    def update_task_progress(self, task_id: str, progress: int, message: str = None):
        """Update task progress"""
        if task_id in self.tasks:
            self.tasks[task_id]['progress'] = progress
            if message:
                self.tasks[task_id]['message'] = message

# Global task manager instance
task_manager = SimpleTaskManager()
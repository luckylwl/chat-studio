"""
Backup API Routes

提供数据库备份和恢复的 API 端点
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List
from pydantic import BaseModel
import logging

from ..utils.backup import backup_manager, backup_scheduler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/backup", tags=["backup"])


class BackupResponse(BaseModel):
    """备份响应模型"""
    success: bool
    message: str
    data: Dict[str, Any] = {}


class RestoreRequest(BaseModel):
    """恢复请求模型"""
    backup_file: str
    backup_type: str  # 'database' or 'storage'


@router.post("/create", response_model=BackupResponse)
async def create_backup(background_tasks: BackgroundTasks):
    """
    创建新备份

    在后台任务中执行备份以避免阻塞
    """
    try:
        # 在后台执行备份
        background_tasks.add_task(backup_manager.backup_all)

        return BackupResponse(
            success=True,
            message="Backup started in background",
            data={
                "status": "running"
            }
        )

    except Exception as e:
        logger.error(f"Failed to start backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=BackupResponse)
async def list_backups():
    """
    列出所有备份
    """
    try:
        backups = backup_manager.list_backups()

        return BackupResponse(
            success=True,
            message="Backups retrieved successfully",
            data=backups
        )

    except Exception as e:
        logger.error(f"Failed to list backups: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=BackupResponse)
async def get_backup_stats():
    """
    获取备份统计信息
    """
    try:
        stats = backup_manager.get_backup_stats()

        return BackupResponse(
            success=True,
            message="Backup stats retrieved successfully",
            data=stats
        )

    except Exception as e:
        logger.error(f"Failed to get backup stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore", response_model=BackupResponse)
async def restore_backup(request: RestoreRequest):
    """
    恢复备份

    警告: 这将覆盖当前数据!
    """
    try:
        if request.backup_type == "database":
            await backup_manager.restore_database(request.backup_file)
        else:
            raise HTTPException(
                status_code=400,
                detail="Only database restore is currently supported"
            )

        return BackupResponse(
            success=True,
            message="Backup restored successfully",
            data={
                "file": request.backup_file,
                "type": request.backup_type
            }
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to restore backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{backup_type}/{backup_file}")
async def delete_backup(backup_type: str, backup_file: str):
    """
    删除指定备份
    """
    try:
        from pathlib import Path

        if backup_type == "database":
            file_path = backup_manager.db_backup_dir / backup_file
        elif backup_type == "storage":
            file_path = backup_manager.storage_backup_dir / backup_file
        else:
            raise HTTPException(status_code=400, detail="Invalid backup type")

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Backup file not found")

        file_path.unlink()

        return BackupResponse(
            success=True,
            message="Backup deleted successfully",
            data={
                "file": backup_file,
                "type": backup_type
            }
        )

    except Exception as e:
        logger.error(f"Failed to delete backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduler/start", response_model=BackupResponse)
async def start_scheduler():
    """
    启动自动备份调度器
    """
    try:
        await backup_scheduler.start()

        return BackupResponse(
            success=True,
            message="Backup scheduler started",
            data={
                "status": "running",
                "interval_hours": backup_scheduler.interval.total_seconds() / 3600
            }
        )

    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduler/stop", response_model=BackupResponse)
async def stop_scheduler():
    """
    停止自动备份调度器
    """
    try:
        await backup_scheduler.stop()

        return BackupResponse(
            success=True,
            message="Backup scheduler stopped",
            data={
                "status": "stopped"
            }
        )

    except Exception as e:
        logger.error(f"Failed to stop scheduler: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scheduler/status", response_model=BackupResponse)
async def get_scheduler_status():
    """
    获取调度器状态
    """
    return BackupResponse(
        success=True,
        message="Scheduler status retrieved",
        data={
            "running": backup_scheduler.running,
            "interval_hours": backup_scheduler.interval.total_seconds() / 3600
        }
    )


@router.post("/cleanup", response_model=BackupResponse)
async def cleanup_old_backups():
    """
    手动清理旧备份
    """
    try:
        cleaned = await backup_manager.cleanup_old_backups()

        return BackupResponse(
            success=True,
            message="Old backups cleaned up",
            data=cleaned
        )

    except Exception as e:
        logger.error(f"Failed to cleanup backups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

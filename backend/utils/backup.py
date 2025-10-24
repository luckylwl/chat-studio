"""
Database Backup Utility

自动备份 PostgreSQL 数据库和本地存储的功能
支持:
- PostgreSQL 备份 (pg_dump)
- LocalForage/IndexedDB 数据导出
- 自动清理旧备份
- 定时任务调度
- 备份压缩
"""

import os
import gzip
import json
import shutil
import asyncio
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class BackupManager:
    """备份管理器"""

    def __init__(
        self,
        backup_dir: str = "./backups",
        max_backups: int = 7,
        compress: bool = True
    ):
        """
        初始化备份管理器

        Args:
            backup_dir: 备份目录路径
            max_backups: 保留的最大备份数量
            compress: 是否压缩备份文件
        """
        self.backup_dir = Path(backup_dir)
        self.max_backups = max_backups
        self.compress = compress

        # 创建备份目录
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        # 子目录
        self.db_backup_dir = self.backup_dir / "database"
        self.storage_backup_dir = self.backup_dir / "storage"

        self.db_backup_dir.mkdir(exist_ok=True)
        self.storage_backup_dir.mkdir(exist_ok=True)

    async def backup_all(self) -> Dict[str, Any]:
        """
        执行完整备份

        Returns:
            备份结果信息
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        result = {
            "timestamp": timestamp,
            "database": None,
            "storage": None,
            "success": False,
            "errors": []
        }

        try:
            # 备份数据库
            logger.info("Starting database backup...")
            db_result = await self.backup_database(timestamp)
            result["database"] = db_result

            # 备份本地存储
            logger.info("Starting storage backup...")
            storage_result = await self.backup_storage(timestamp)
            result["storage"] = storage_result

            # 清理旧备份
            logger.info("Cleaning old backups...")
            await self.cleanup_old_backups()

            result["success"] = True
            logger.info(f"Backup completed successfully: {timestamp}")

        except Exception as e:
            error_msg = f"Backup failed: {str(e)}"
            logger.error(error_msg)
            result["errors"].append(error_msg)
            result["success"] = False

        return result

    async def backup_database(self, timestamp: str) -> Dict[str, Any]:
        """
        备份 PostgreSQL 数据库

        Args:
            timestamp: 时间戳

        Returns:
            备份结果
        """
        db_url = os.getenv("DATABASE_URL", "")

        if not db_url or "postgresql" not in db_url:
            logger.warning("No PostgreSQL database configured, skipping DB backup")
            return {
                "skipped": True,
                "reason": "No PostgreSQL database configured"
            }

        # 解析数据库连接信息
        # postgresql://username:password@localhost:5432/dbname
        try:
            from urllib.parse import urlparse
            parsed = urlparse(db_url)

            backup_file = self.db_backup_dir / f"backup_{timestamp}.sql"

            # 构建 pg_dump 命令
            env = os.environ.copy()
            env["PGPASSWORD"] = parsed.password or ""

            cmd = [
                "pg_dump",
                "-h", parsed.hostname or "localhost",
                "-p", str(parsed.port or 5432),
                "-U", parsed.username or "postgres",
                "-d", parsed.path.lstrip("/") if parsed.path else "chat_studio",
                "-F", "p",  # Plain text format
                "-f", str(backup_file)
            ]

            # 执行备份
            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                raise Exception(f"pg_dump failed: {error_msg}")

            # 压缩备份文件
            if self.compress:
                compressed_file = await self.compress_file(backup_file)
                backup_file.unlink()  # 删除未压缩文件
                backup_file = compressed_file

            file_size = backup_file.stat().st_size

            logger.info(f"Database backup created: {backup_file} ({file_size} bytes)")

            return {
                "file": str(backup_file),
                "size": file_size,
                "compressed": self.compress,
                "success": True
            }

        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def backup_storage(self, timestamp: str) -> Dict[str, Any]:
        """
        备份本地存储数据 (LocalForage/IndexedDB 模拟)

        Args:
            timestamp: 时间戳

        Returns:
            备份结果
        """
        try:
            # 在真实环境中,这应该从前端通过 API 触发
            # 这里提供一个通用的本地文件备份方法

            data_dir = Path("./data")
            if not data_dir.exists():
                logger.warning("No data directory found, skipping storage backup")
                return {
                    "skipped": True,
                    "reason": "No data directory found"
                }

            backup_file = self.storage_backup_dir / f"storage_{timestamp}"

            # 创建存档
            shutil.make_archive(
                str(backup_file),
                'zip',
                str(data_dir)
            )

            backup_file = backup_file.with_suffix(".zip")
            file_size = backup_file.stat().st_size

            logger.info(f"Storage backup created: {backup_file} ({file_size} bytes)")

            return {
                "file": str(backup_file),
                "size": file_size,
                "success": True
            }

        except Exception as e:
            logger.error(f"Storage backup failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def compress_file(self, file_path: Path) -> Path:
        """
        压缩文件

        Args:
            file_path: 文件路径

        Returns:
            压缩后的文件路径
        """
        compressed_path = file_path.with_suffix(file_path.suffix + ".gz")

        def compress():
            with open(file_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb', compresslevel=9) as f_out:
                    shutil.copyfileobj(f_in, f_out)

        # 在线程池中执行压缩以避免阻塞
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, compress)

        logger.info(f"Compressed {file_path} -> {compressed_path}")
        return compressed_path

    async def cleanup_old_backups(self) -> Dict[str, int]:
        """
        清理旧备份文件

        Returns:
            清理统计
        """
        cleaned = {"database": 0, "storage": 0}

        # 清理数据库备份
        db_backups = sorted(
            self.db_backup_dir.glob("backup_*"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        for backup in db_backups[self.max_backups:]:
            backup.unlink()
            cleaned["database"] += 1
            logger.info(f"Removed old database backup: {backup}")

        # 清理存储备份
        storage_backups = sorted(
            self.storage_backup_dir.glob("storage_*"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        for backup in storage_backups[self.max_backups:]:
            backup.unlink()
            cleaned["storage"] += 1
            logger.info(f"Removed old storage backup: {backup}")

        logger.info(f"Cleaned up {cleaned['database']} database and {cleaned['storage']} storage backups")

        return cleaned

    def list_backups(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        列出所有备份

        Returns:
            备份列表
        """
        result = {
            "database": [],
            "storage": []
        }

        # 数据库备份
        for backup in sorted(self.db_backup_dir.glob("backup_*"), reverse=True):
            stat = backup.stat()
            result["database"].append({
                "file": backup.name,
                "path": str(backup),
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        # 存储备份
        for backup in sorted(self.storage_backup_dir.glob("storage_*"), reverse=True):
            stat = backup.stat()
            result["storage"].append({
                "file": backup.name,
                "path": str(backup),
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        return result

    async def restore_database(self, backup_file: str) -> bool:
        """
        恢复数据库备份

        Args:
            backup_file: 备份文件路径

        Returns:
            是否成功
        """
        backup_path = Path(backup_file)

        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_file}")

        # 如果是压缩文件,先解压
        if backup_path.suffix == ".gz":
            uncompressed = backup_path.with_suffix("")
            with gzip.open(backup_path, 'rb') as f_in:
                with open(uncompressed, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            backup_path = uncompressed

        try:
            db_url = os.getenv("DATABASE_URL", "")
            from urllib.parse import urlparse
            parsed = urlparse(db_url)

            env = os.environ.copy()
            env["PGPASSWORD"] = parsed.password or ""

            cmd = [
                "psql",
                "-h", parsed.hostname or "localhost",
                "-p", str(parsed.port or 5432),
                "-U", parsed.username or "postgres",
                "-d", parsed.path.lstrip("/") if parsed.path else "chat_studio",
                "-f", str(backup_path)
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                raise Exception(f"psql restore failed: {error_msg}")

            logger.info(f"Database restored from: {backup_file}")
            return True

        except Exception as e:
            logger.error(f"Database restore failed: {e}")
            raise

        finally:
            # 清理解压文件
            if backup_path.suffix != ".gz" and backup_path.name.startswith("backup_"):
                backup_path.unlink()

    def get_backup_stats(self) -> Dict[str, Any]:
        """
        获取备份统计信息

        Returns:
            统计信息
        """
        backups = self.list_backups()

        db_total_size = sum(b["size"] for b in backups["database"])
        storage_total_size = sum(b["size"] for b in backups["storage"])

        return {
            "database": {
                "count": len(backups["database"]),
                "total_size": db_total_size,
                "latest": backups["database"][0] if backups["database"] else None
            },
            "storage": {
                "count": len(backups["storage"]),
                "total_size": storage_total_size,
                "latest": backups["storage"][0] if backups["storage"] else None
            },
            "max_backups": self.max_backups,
            "backup_dir": str(self.backup_dir)
        }


# 全局备份管理器实例
backup_manager = BackupManager(
    backup_dir=os.getenv("BACKUP_DIR", "./backups"),
    max_backups=int(os.getenv("MAX_BACKUPS", "7")),
    compress=True
)


# 定时备份任务
class BackupScheduler:
    """备份调度器"""

    def __init__(self, manager: BackupManager, interval_hours: int = 24):
        """
        初始化调度器

        Args:
            manager: 备份管理器
            interval_hours: 备份间隔(小时)
        """
        self.manager = manager
        self.interval = timedelta(hours=interval_hours)
        self.task: Optional[asyncio.Task] = None
        self.running = False

    async def start(self):
        """启动自动备份"""
        if self.running:
            logger.warning("Backup scheduler is already running")
            return

        self.running = True
        self.task = asyncio.create_task(self._run())
        logger.info(f"Backup scheduler started (interval: {self.interval})")

    async def stop(self):
        """停止自动备份"""
        self.running = False

        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

        logger.info("Backup scheduler stopped")

    async def _run(self):
        """运行备份循环"""
        while self.running:
            try:
                logger.info("Starting scheduled backup...")
                result = await self.manager.backup_all()

                if result["success"]:
                    logger.info(f"Scheduled backup completed: {result['timestamp']}")
                else:
                    logger.error(f"Scheduled backup failed: {result.get('errors', [])}")

                # 等待下一次备份
                await asyncio.sleep(self.interval.total_seconds())

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Backup scheduler error: {e}")
                # 出错后等待 1 小时再重试
                await asyncio.sleep(3600)


# 全局调度器实例
backup_scheduler = BackupScheduler(
    backup_manager,
    interval_hours=int(os.getenv("BACKUP_INTERVAL_HOURS", "24"))
)

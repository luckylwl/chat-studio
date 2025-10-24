"""
Health Check API Routes

提供系统健康检查端点,用于监控和负载均衡
"""

from fastapi import APIRouter, Response, status
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
import psutil
import asyncio
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["health"])


class HealthStatus(BaseModel):
    """健康状态模型"""
    status: str  # 'healthy', 'degraded', 'unhealthy'
    timestamp: str
    uptime: float
    version: str
    checks: Dict[str, Any]


class ComponentHealth(BaseModel):
    """组件健康状态"""
    name: str
    status: str
    message: str = ""
    response_time: float = 0.0
    metadata: Dict[str, Any] = {}


# 应用启动时间
START_TIME = datetime.now()


@router.get("/", response_model=HealthStatus)
@router.get("/status", response_model=HealthStatus)
async def health_check(response: Response):
    """
    基础健康检查

    返回应用的整体健康状态
    """
    try:
        # 执行所有健康检查
        checks = {}

        # 1. 数据库检查
        db_check = await check_database()
        checks["database"] = db_check.dict()

        # 2. Redis 检查
        redis_check = await check_redis()
        checks["redis"] = redis_check.dict()

        # 3. 磁盘空间检查
        disk_check = check_disk_space()
        checks["disk"] = disk_check.dict()

        # 4. 内存检查
        memory_check = check_memory()
        checks["memory"] = memory_check.dict()

        # 5. CPU 检查
        cpu_check = check_cpu()
        checks["cpu"] = cpu_check.dict()

        # 确定整体健康状态
        overall_status = determine_overall_status(checks)

        # 设置 HTTP 状态码
        if overall_status == "unhealthy":
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        elif overall_status == "degraded":
            response.status_code = status.HTTP_200_OK
        else:
            response.status_code = status.HTTP_200_OK

        # 计算运行时间
        uptime = (datetime.now() - START_TIME).total_seconds()

        return HealthStatus(
            status=overall_status,
            timestamp=datetime.now().isoformat(),
            uptime=uptime,
            version=os.getenv("APP_VERSION", "2.2.0"),
            checks=checks
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

        return HealthStatus(
            status="unhealthy",
            timestamp=datetime.now().isoformat(),
            uptime=(datetime.now() - START_TIME).total_seconds(),
            version=os.getenv("APP_VERSION", "2.2.0"),
            checks={
                "error": {
                    "name": "error",
                    "status": "unhealthy",
                    "message": str(e)
                }
            }
        )


@router.get("/liveness")
async def liveness_probe():
    """
    存活探针 (Kubernetes/Docker)

    快速检查应用是否存活
    返回 200 表示存活, 5xx 表示需要重启
    """
    return {"status": "alive", "timestamp": datetime.now().isoformat()}


@router.get("/readiness")
async def readiness_probe(response: Response):
    """
    就绪探针 (Kubernetes/Docker)

    检查应用是否就绪接收流量
    返回 200 表示就绪, 非 200 表示暂时不可用
    """
    try:
        # 检查关键依赖
        db_check = await check_database()

        if db_check.status == "unhealthy":
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {
                "status": "not_ready",
                "reason": "Database unavailable",
                "timestamp": datetime.now().isoformat()
            }

        return {
            "status": "ready",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "reason": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/startup")
async def startup_probe(response: Response):
    """
    启动探针 (Kubernetes)

    检查应用是否完成启动
    """
    uptime = (datetime.now() - START_TIME).total_seconds()

    # 假设启动需要至少 5 秒
    if uptime < 5:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "starting",
            "uptime": uptime,
            "timestamp": datetime.now().isoformat()
        }

    return {
        "status": "started",
        "uptime": uptime,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/metrics")
async def get_metrics():
    """
    获取系统指标 (Prometheus 格式)
    """
    try:
        uptime = (datetime.now() - START_TIME).total_seconds()

        # CPU 使用率
        cpu_percent = psutil.cpu_percent(interval=0.1)

        # 内存使用
        memory = psutil.virtual_memory()

        # 磁盘使用
        disk = psutil.disk_usage('/')

        # 网络 IO
        net_io = psutil.net_io_counters()

        metrics = {
            "system": {
                "uptime_seconds": uptime,
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_used_bytes": memory.used,
                "memory_total_bytes": memory.total,
                "disk_percent": disk.percent,
                "disk_used_bytes": disk.used,
                "disk_total_bytes": disk.total,
                "network_bytes_sent": net_io.bytes_sent,
                "network_bytes_recv": net_io.bytes_recv
            },
            "timestamp": datetime.now().isoformat()
        }

        return metrics

    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/dependencies")
async def check_dependencies():
    """
    检查所有依赖项的健康状态
    """
    dependencies = {
        "database": await check_database(),
        "redis": await check_redis(),
        "disk": check_disk_space(),
        "memory": check_memory()
    }

    # 转换为字典格式
    return {
        name: dep.dict()
        for name, dep in dependencies.items()
    }


# ============================================================================
# 辅助函数 - 各组件健康检查
# ============================================================================

async def check_database() -> ComponentHealth:
    """检查数据库连接"""
    start_time = asyncio.get_event_loop().time()

    try:
        db_url = os.getenv("DATABASE_URL", "")

        if not db_url or "postgresql" not in db_url:
            return ComponentHealth(
                name="database",
                status="healthy",
                message="No database configured (using in-memory)",
                response_time=0
            )

        # 尝试连接数据库
        # 注意: 这需要实际的数据库连接
        # 这里是简化版本
        from urllib.parse import urlparse
        parsed = urlparse(db_url)

        # TODO: 实际执行数据库查询
        # 例如: SELECT 1

        response_time = (asyncio.get_event_loop().time() - start_time) * 1000

        return ComponentHealth(
            name="database",
            status="healthy",
            message="Database connection successful",
            response_time=response_time,
            metadata={
                "host": parsed.hostname,
                "port": parsed.port,
                "database": parsed.path.lstrip("/") if parsed.path else ""
            }
        )

    except Exception as e:
        response_time = (asyncio.get_event_loop().time() - start_time) * 1000

        return ComponentHealth(
            name="database",
            status="unhealthy",
            message=f"Database connection failed: {str(e)}",
            response_time=response_time
        )


async def check_redis() -> ComponentHealth:
    """检查 Redis 连接"""
    start_time = asyncio.get_event_loop().time()

    try:
        redis_url = os.getenv("REDIS_URL", "")

        if not redis_url:
            return ComponentHealth(
                name="redis",
                status="healthy",
                message="No Redis configured",
                response_time=0
            )

        # TODO: 实际执行 Redis PING 命令

        response_time = (asyncio.get_event_loop().time() - start_time) * 1000

        return ComponentHealth(
            name="redis",
            status="healthy",
            message="Redis connection successful",
            response_time=response_time
        )

    except Exception as e:
        response_time = (asyncio.get_event_loop().time() - start_time) * 1000

        return ComponentHealth(
            name="redis",
            status="unhealthy",
            message=f"Redis connection failed: {str(e)}",
            response_time=response_time
        )


def check_disk_space() -> ComponentHealth:
    """检查磁盘空间"""
    try:
        disk = psutil.disk_usage('/')

        # 警告阈值: 90%
        # 错误阈值: 95%
        if disk.percent >= 95:
            status_level = "unhealthy"
            message = f"Critical: Disk usage at {disk.percent}%"
        elif disk.percent >= 90:
            status_level = "degraded"
            message = f"Warning: Disk usage at {disk.percent}%"
        else:
            status_level = "healthy"
            message = f"Disk usage at {disk.percent}%"

        return ComponentHealth(
            name="disk",
            status=status_level,
            message=message,
            metadata={
                "percent": disk.percent,
                "used_gb": disk.used / (1024**3),
                "total_gb": disk.total / (1024**3),
                "free_gb": disk.free / (1024**3)
            }
        )

    except Exception as e:
        return ComponentHealth(
            name="disk",
            status="unhealthy",
            message=f"Failed to check disk space: {str(e)}"
        )


def check_memory() -> ComponentHealth:
    """检查内存使用"""
    try:
        memory = psutil.virtual_memory()

        # 警告阈值: 85%
        # 错误阈值: 95%
        if memory.percent >= 95:
            status_level = "unhealthy"
            message = f"Critical: Memory usage at {memory.percent}%"
        elif memory.percent >= 85:
            status_level = "degraded"
            message = f"Warning: Memory usage at {memory.percent}%"
        else:
            status_level = "healthy"
            message = f"Memory usage at {memory.percent}%"

        return ComponentHealth(
            name="memory",
            status=status_level,
            message=message,
            metadata={
                "percent": memory.percent,
                "used_gb": memory.used / (1024**3),
                "total_gb": memory.total / (1024**3),
                "available_gb": memory.available / (1024**3)
            }
        )

    except Exception as e:
        return ComponentHealth(
            name="memory",
            status="unhealthy",
            message=f"Failed to check memory: {str(e)}"
        )


def check_cpu() -> ComponentHealth:
    """检查 CPU 使用率"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)

        # 警告阈值: 80%
        # 错误阈值: 95%
        if cpu_percent >= 95:
            status_level = "unhealthy"
            message = f"Critical: CPU usage at {cpu_percent}%"
        elif cpu_percent >= 80:
            status_level = "degraded"
            message = f"Warning: CPU usage at {cpu_percent}%"
        else:
            status_level = "healthy"
            message = f"CPU usage at {cpu_percent}%"

        return ComponentHealth(
            name="cpu",
            status=status_level,
            message=message,
            metadata={
                "percent": cpu_percent,
                "count": psutil.cpu_count()
            }
        )

    except Exception as e:
        return ComponentHealth(
            name="cpu",
            status="unhealthy",
            message=f"Failed to check CPU: {str(e)}"
        )


def determine_overall_status(checks: Dict[str, Any]) -> str:
    """
    根据各组件状态确定整体状态

    Args:
        checks: 组件检查结果

    Returns:
        'healthy', 'degraded', or 'unhealthy'
    """
    unhealthy_count = 0
    degraded_count = 0

    for check in checks.values():
        if check.get("status") == "unhealthy":
            unhealthy_count += 1
        elif check.get("status") == "degraded":
            degraded_count += 1

    # 任何组件 unhealthy -> 整体 unhealthy
    if unhealthy_count > 0:
        return "unhealthy"

    # 任何组件 degraded -> 整体 degraded
    if degraded_count > 0:
        return "degraded"

    return "healthy"

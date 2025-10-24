"""
Centralized Logging System
Provides structured logging with multiple handlers and formatters
"""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime
import json
from typing import Optional, Dict, Any

class JSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs JSON for structured logging
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        # Add custom fields from extra parameter
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)

        return json.dumps(log_data)


class ColoredFormatter(logging.Formatter):
    """
    Colored console output for better readability
    """

    COLORS = {
        'DEBUG': '\033[0;36m',    # Cyan
        'INFO': '\033[0;32m',     # Green
        'WARNING': '\033[0;33m',  # Yellow
        'ERROR': '\033[0;31m',    # Red
        'CRITICAL': '\033[0;35m', # Magenta
    }
    RESET = '\033[0m'

    def format(self, record: logging.LogRecord) -> str:
        levelname = record.levelname
        color = self.COLORS.get(levelname, '')

        # Color the level name
        record.levelname = f"{color}{levelname}{self.RESET}"

        # Format the message
        message = super().format(record)

        return message


def setup_logger(
    name: str,
    log_level: str = 'INFO',
    log_dir: Optional[Path] = None,
    enable_console: bool = True,
    enable_file: bool = True,
    enable_json: bool = False,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
) -> logging.Logger:
    """
    Setup and configure a logger with multiple handlers

    Args:
        name: Logger name
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        enable_console: Enable console output
        enable_file: Enable file output
        enable_json: Enable JSON formatted file output
        max_bytes: Maximum size of log file before rotation
        backup_count: Number of backup files to keep

    Returns:
        Configured logger instance
    """

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers
    logger.handlers.clear()

    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)

        console_formatter = ColoredFormatter(
            '%(asctime)s [%(levelname)s] %(name)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    # File handlers
    if enable_file and log_dir:
        log_dir = Path(log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)

        # Rotating file handler for general logs
        file_handler = RotatingFileHandler(
            log_dir / f"{name}.log",
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)

        file_formatter = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s - %(message)s (%(filename)s:%(lineno)d)',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

        # Error file handler (only errors and above)
        error_handler = RotatingFileHandler(
            log_dir / f"{name}_error.log",
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        logger.addHandler(error_handler)

        # JSON file handler for structured logging
        if enable_json:
            json_handler = TimedRotatingFileHandler(
                log_dir / f"{name}_json.log",
                when='midnight',
                interval=1,
                backupCount=30,
                encoding='utf-8'
            )
            json_handler.setLevel(logging.DEBUG)
            json_handler.setFormatter(JSONFormatter())
            logger.addHandler(json_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


class RequestLogger:
    """
    Context manager for logging API requests
    """

    def __init__(self, logger: logging.Logger, endpoint: str, method: str):
        self.logger = logger
        self.endpoint = endpoint
        self.method = method
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.info(f"{self.method} {self.endpoint} - Request started")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.now() - self.start_time).total_seconds()

        if exc_type:
            self.logger.error(
                f"{self.method} {self.endpoint} - Request failed ({duration:.2f}s): {exc_val}"
            )
        else:
            self.logger.info(
                f"{self.method} {self.endpoint} - Request completed ({duration:.2f}s)"
            )


# Global logger instances
app_logger = setup_logger(
    'app',
    log_level='INFO',
    log_dir=Path('./logs'),
    enable_console=True,
    enable_file=True,
    enable_json=True
)

api_logger = setup_logger(
    'api',
    log_level='DEBUG',
    log_dir=Path('./logs'),
    enable_console=True,
    enable_file=True,
    enable_json=True
)

db_logger = setup_logger(
    'database',
    log_level='INFO',
    log_dir=Path('./logs'),
    enable_console=True,
    enable_file=True,
    enable_json=False
)

security_logger = setup_logger(
    'security',
    log_level='WARNING',
    log_dir=Path('./logs'),
    enable_console=True,
    enable_file=True,
    enable_json=True
)


def log_with_context(
    logger: logging.Logger,
    level: str,
    message: str,
    **context: Dict[str, Any]
):
    """
    Log message with additional context

    Args:
        logger: Logger instance
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        message: Log message
        **context: Additional context data
    """

    extra = {'extra_fields': context}
    log_func = getattr(logger, level.lower())
    log_func(message, extra=extra)


# Example usage:
"""
from backend.utils.logger import app_logger, api_logger, RequestLogger, log_with_context

# Basic logging
app_logger.info("Application started")
app_logger.error("An error occurred", exc_info=True)

# Request logging
with RequestLogger(api_logger, '/api/chat', 'POST'):
    # Your API logic here
    pass

# Logging with context
log_with_context(
    api_logger,
    'info',
    'User action',
    user_id='123',
    action='send_message',
    conversation_id='abc'
)
"""

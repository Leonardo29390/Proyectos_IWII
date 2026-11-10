# app/routes/__init__.py
from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.routes.transactions import transactions_bp

__all__ = ['health_bp', 'auth_bp', 'transactions_bp']
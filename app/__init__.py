# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Registrar blueprints
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.transactions import transactions_bp  # <-- NUEVA LÍNEA
    
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')  # <-- NUEVA LÍNEA
    
    # 🆕 RUTA RAÍZ (opcional)
    @app.route('/')
    def index():
        return {
            'message': '💰 Finanzas API funcionando',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health/',
                'docs': '/docs (próximamente)',
                'auth': '/api/auth (próximamente)',
                'transactions': '/api/transactions (próximamente)'
            }
        }
    
    with app.app_context():
        db.create_all()
        print("✅ Base de datos inicializada")
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)
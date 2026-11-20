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
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Importaciones adentro de la función
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.transactions import transactions_bp
    from app.routes.dashboard import dashboard_bp
    
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    
    with app.app_context():
        db.create_all()
        print("✅ Base de datos inicializada")
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)
# app/routes/transactions.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Transaction

transactions_bp = Blueprint('transactions', __name__)

# Ruta para CREAR una transacción (ingreso o gasto)
@transactions_bp.route('/', methods=['POST'])
@jwt_required() # Esto significa que requiere estar logueado (necesitas el Token)
def create_transaction():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validaciones básicas
    if not data or not data.get('type') or not data.get('amount') or not data.get('description'):
        return jsonify({'error': 'Faltan datos: type, amount y description son requeridos'}), 400
        
    if data['type'] not in ['income', 'expense']:
        return jsonify({'error': 'El tipo debe ser "income" (ingreso) o "expense" (gasto)'}), 400

    # Crear la transacción en la base de datos
    new_transaction = Transaction(
        user_id=current_user_id,
        type=data['type'],
        amount=data['amount'],
        description=data['description'],
        currency=data.get('currency', 'COP'),
        category_id=data.get('category_id') # Opcional por ahora
    )
    
    db.session.add(new_transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Transacción registrada exitosamente',
        'transaction': new_transaction.to_dict()
    }), 201

# Ruta para LISTAR las transacciones del usuario
@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_id = int(get_jwt_identity())
    
    # Buscar solo las transacciones del usuario logueado
    transactions = Transaction.query.filter_by(user_id=current_user_id).order_by(Transaction.date.desc()).all()
    
    return jsonify({
        'transactions': [t.to_dict() for t in transactions],
        'total': len(transactions)
    }), 200
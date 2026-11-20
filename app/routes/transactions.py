# app/routes/transactions.py
import csv
import io
import requests
import pandas as pd
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Transaction, User

transactions_bp = Blueprint('transactions', __name__)

# ==========================================
# 1. TRANSACCIONES (CREAR Y LISTAR)
# ==========================================

@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('type') or not data.get('amount') or not data.get('description'):
        return jsonify({'error': 'Faltan datos: type, amount y description son requeridos'}), 400
        
    if data['type'] not in ['income', 'expense']:
        return jsonify({'error': 'El tipo debe ser "income" (ingreso) o "expense" (gasto)'}), 400

    new_transaction = Transaction(
        user_id=current_user_id,
        type=data['type'],
        amount=data['amount'],
        description=data['description'],
        currency=data.get('currency', 'COP'),
        category_id=data.get('category_id')
    )
    
    db.session.add(new_transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Transacción registrada exitosamente',
        'transaction': new_transaction.to_dict()
    }), 201

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_id = int(get_jwt_identity())
    transactions = Transaction.query.filter_by(user_id=current_user_id).order_by(Transaction.date.desc()).all()
    
    return jsonify({
        'transactions': [t.to_dict() for t in transactions],
        'total': len(transactions)
    }), 200

# ==========================================
# 2. EXPORTACIÓN (EXCEL Y CSV)
# ==========================================

@transactions_bp.route('/export', methods=['GET'])
@jwt_required()
def export_transactions():
    current_user_id = int(get_jwt_identity())
    format_type = request.args.get('format', 'csv')
    
    transactions = Transaction.query.filter_by(user_id=current_user_id).all()
    data = [t.to_dict() for t in transactions]

    if not data:
        return jsonify({'error': 'No hay transacciones para exportar'}), 404

    df = pd.DataFrame(data)
    if 'id' in df.columns: 
        df = df.drop(columns=['id', 'user_id', 'category_id'])

    if format_type == 'csv':
        output = io.StringIO()
        df.to_csv(output, index=False)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=mis_finanzas.csv"}
        )
    
    elif format_type == 'excel':
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Transacciones')
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment;filename=mis_finanzas.xlsx"}
        )

# ==========================================
# 3. CONVERSIÓN DE MONEDAS (API EXTERNA)
# ==========================================

@transactions_bp.route('/convert', methods=['GET'])
@jwt_required()
def convert_currency():
    from_currency = request.args.get('from', 'USD')
    to_currency = request.args.get('to', 'COP')
    amount = request.args.get('amount', 1, type=float)

    try:
        url = f"https://open.er-api.com/v6/latest/{from_currency}"
        response = requests.get(url)
        data = response.json()
        
        if data['result'] == 'success':
            rate = data['rates'][to_currency]
            converted = amount * rate
            return jsonify({
                'from': from_currency,
                'to': to_currency,
                'amount': amount,
                'rate': rate,
                'converted': round(converted, 2)
            }), 200
        else:
            return jsonify({'error': 'Error al obtener la tasa de cambio'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# 4. PRESUPUESTO MENSUAL
# ==========================================

@transactions_bp.route('/budget', methods=['PUT'])
@jwt_required()
def update_budget():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or 'monthly_budget' not in data:
        return jsonify({'error': 'Falta el campo monthly_budget'}), 400
        
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    user.monthly_budget = float(data['monthly_budget'])
    db.session.commit()
    
    return jsonify({'message': 'Presupuesto actualizado', 'monthly_budget': user.monthly_budget}), 200

@transactions_bp.route('/budget', methods=['GET'])
@jwt_required()
def get_budget():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    return jsonify({'monthly_budget': user.monthly_budget}), 200
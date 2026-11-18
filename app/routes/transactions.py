# app/routes/transactions.py
import csv
import io
from flask import Response
import pandas as pd # Usamos pandas para el Excel
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
    
    # Nueva ruta para EXPORTAR
@transactions_bp.route('/export', methods=['GET'])
@jwt_required()
def export_transactions():
    current_user_id = int(get_jwt_identity())
    format_type = request.args.get('format', 'csv') # csv o excel
    
    transactions = Transaction.query.filter_by(user_id=current_user_id).all()
    data = [t.to_dict() for t in transactions]

    if not data:
        return jsonify({'error': 'No hay transacciones para exportar'}), 404

    df = pd.DataFrame(data)
    # Limpiamos columnas que no sirven para el reporte
    if 'id' in df.columns: df = df.drop(columns=['id', 'user_id', 'category_id'])

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
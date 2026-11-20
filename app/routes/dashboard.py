# app/routes/dashboard.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction
from app import db
import os
from groq import Groq

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/ai-advice', methods=['GET'])
@jwt_required()
def get_ai_advice():
    current_user_id = int(get_jwt_identity())
    transactions = Transaction.query.filter_by(user_id=current_user_id).all()
    
    if not transactions:
        return jsonify({'advice': 'Aún no tienes transacciones registradas. ¡Empieza a registrar tus gastos para darte un consejo!'}), 200

    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    
    # --- NUEVOS CÁLCULOS EXACTOS ---
    saldo_disponible = total_income - total_expense
    tasa_ahorro = (saldo_disponible / total_income * 100) if total_income > 0 else 0
    
    # Sugerencia de inversión exacta basada en el saldo
    fondo_emergencia = saldo_disponible * 0.36
    renta_fija = saldo_disponible * 0.29
    renta_variable = saldo_disponible * 0.35
    
    prompt = f"""
    Actúa como un Asesor Financiero Senior de élite. 
    Aquí están mis datos y los cálculos exactos de mi situación. NO modifiques estos números, úsalos tal cual para tu análisis:

    - Ingresos totales: ${total_income:,.0f} COP
    - Gastos totales: ${total_expense:,.0f} COP
    - Saldo disponible para invertir/ahorrar: ${saldo_disponible:,.0f} COP
    - Mi tasa de ahorro es del: {tasa_ahorro:.1f}% del ingreso.

    Basado en este saldo disponible (${saldo_disponible:,.0f} COP), aquí tienes mi propuesta de asignación (puedes sugerir ajustes):
    - Fondo de emergencia (36%): ${fondo_emergencia:,.0f} COP
    - Renta Fija (29%): ${renta_fija:,.0f} COP
    - Renta Variable (35%): ${renta_variable:,.0f} COP

    Por favor, genera un informe ejecutivo estructurado en Markdown con este formato:
    1. **Diagnóstico y Ratios**: Usa mi tasa de ahorro exacta y dime si es saludable.
    2. **Optimización de Gastos**: 2 tácticas para no gastar tanto.
    3. **Estrategia de Inversión**: Dime exactamente qué ETFs, CDTs o Cuentas de alto rendimiento usar con los montos exactos que te di.
    4. **Plan de Acción (30 días)**: 3 pasos para ejecutar este plan.
    
    Sé muy profesional y directo. NO inventes números ni modifiques las sumas.
    """
    try:
        # Leyendo la llave directamente para evitar problemas con Docker .env
        api_key = os.environ.get('GROQ_API_KEY')
        
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b", 
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000
        )
        advice = response.choices[0].message.content
        return jsonify({'advice': advice}), 200
    except Exception as e:
        # SI FALLA, AHORA NOS DIRÁ EL ERROR REAL EN LA PANTALLA
        return jsonify({'advice': f"Error de conexión con Groq: {str(e)}"}), 200
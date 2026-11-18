# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copiamos requerimientos e instalamos
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copiamos el resto del código
COPY . .

# Exponemos el puerto
EXPOSE 5000

# Comando de arranque
CMD ["python", "run.py"]
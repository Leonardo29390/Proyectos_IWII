from flask import Blueprint

main = Blueprint("main", __name__)


@main.route("/")
def inicio():
    return "Ingenieria Web II - Proyecto funcionando"
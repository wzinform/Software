from .auth_routes import auth_bp
from .user_routes import user_bp
from .admin_routes import admin_bp
from .price import price
from .aicenter import aicenter
from .mainpage import mainpage
from .underwater import underwater

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(price)
    app.register_blueprint(aicenter)
    app.register_blueprint(mainpage)
    app.register_blueprint(underwater)




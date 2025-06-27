from flask import Flask
from routes import register_routes
from flask_cors import CORS
from extensions import db
from flask_jwt_extended import JWTManager


app = Flask(__name__)
app.config.from_pyfile('config.py')  
CORS(app, origins=["http://localhost:3000"])

app.config['JWT_SECRET_KEY'] = 'a9fdg#12!@#A3fFj9z_Secret987' 
jwt = JWTManager(app)  # ✅ 初始化 JWT 管理器
db.init_app(app)

register_routes(app)

if __name__ == '__main__':
    app.run(debug=True)


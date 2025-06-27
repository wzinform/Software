from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import User
from extensions import db
from werkzeug.security import check_password_hash
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    try:
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())  # 如果你存的是字符串的用户ID
        print(user_id)
    except Exception as e:
        return jsonify({"msg": "无效token或未授权"}), 422

    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '用户不存在'}), 404

    return jsonify({'user': {
        'username': user.username,
        'email': user.email,
        'role': user.role
    }})

@user_bp.route('/api/user/verify-password', methods=['POST'])
@jwt_required()
def verify_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not user or 'password' not in data:
        return jsonify({"valid": False}), 400

    is_valid = check_password_hash(user.password_hash, data['password'])
    return jsonify({"valid": is_valid})

@user_bp.route('/api/user/update', methods=['PUT'])
@jwt_required()
def update_user_self():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "用户不存在"}), 404

    data = request.get_json()
    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']

    db.session.commit()
    return jsonify(user.to_dict())

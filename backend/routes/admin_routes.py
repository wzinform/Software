from flask import Blueprint, request, jsonify
from models.models import User, OperationLog
from extensions import db
from werkzeug.security import generate_password_hash

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/api/admin/users', methods=['GET'])
def get_users():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '')

        query = User.query
        if search:
            query = query.filter(User.username.like(f'%{search}%') | User.email.like(f'%{search}%'))

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        users = [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        } for user in pagination.items]

        return jsonify({
            'users': users,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': '服务器内部错误', 'message': str(e)}), 500


@admin_bp.route('/api/admin/addusers', methods=['POST'])
def add_user():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role_code = data.get('role')
    print("role_code",role_code)

    if not username or not email or not password or not role_code:
        return jsonify({"error": "缺少字段"}), 400

    role_map = {
        '普通用户': 'user',
        '养殖户': 'farmer',
        '管理人员': 'admin'
    }


    role = role_map.get(role_code, 'user')
    print("role",role)

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "用户名或邮箱已存在"}), 400

    password_hash = generate_password_hash(password)

    new_user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        role=role_code
    )
    db.session.add(new_user)
    db.session.commit()

    # 记录日志，假设当前操作管理员id为1
    admin_user = User.query.get(1)
    if admin_user:
        log = OperationLog(user_id=admin_user.id, operation=f"新增用户: {username}")
        db.session.add(log)
        db.session.commit()

    return jsonify(new_user.to_dict()), 201

@admin_bp.route('/api/admin/logs', methods=['GET'])
def get_logs():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    keyword = request.args.get('search', '')

    query = OperationLog.query.join(User).order_by(OperationLog.timestamp.desc())

    if keyword:
        query = query.filter(OperationLog.operation.like(f'%{keyword}%'))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    logs = [log.to_dict() for log in pagination.items]

    return jsonify({
        "logs": logs,
        "total_pages": pagination.pages,
        "current_page": pagination.page
    })

@admin_bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    username = user.username
    db.session.delete(user)
    db.session.commit()

    admin_user = User.query.get(1)  # 假设管理员ID为1
    if admin_user:
        log = OperationLog(user_id=admin_user.id, operation=f"删除用户: {username}")
        db.session.add(log)
        db.session.commit()

    return jsonify({"success": True})

@admin_bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    old_username = user.username
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.role = data.get('role', user.role)
    db.session.commit()

    admin_user = User.query.get(1)
    if admin_user:
        log = OperationLog(user_id=admin_user.id, operation=f"修改用户 {old_username} 的信息")
        db.session.add(log)
        db.session.commit()

    return jsonify(user.to_dict())

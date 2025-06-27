from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask import Response
import json
from sqlalchemy import func
from datetime import datetime
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
from collections import defaultdict
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_jwt_extended import JWTManager


app = Flask(__name__)
CORS(app)
app.config.from_pyfile('config.py')
db = SQLAlchemy(app)
app.config['JWT_SECRET_KEY'] = 'a9fdg#12!@#A3fFj9z_Secret987'
jwt = JWTManager(app)


# 添加全局 OPTIONS 请求处理函数
def _handle_options_request():
    response = jsonify()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return response

############################################Login###########################################
import pymysql
# 数据库连接
def get_db():
    return pymysql.connect(host='localhost', user='root', password='',
                           db='ocean_farm', cursorclass=pymysql.cursors.DictCursor)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    print("收到的数据：", data)  # 👈 关键排查点
    username = data.get('username')
    email = data.get('email')
    password_plain = data.get('password')
    role = data.get('role', '普通用户')  # 默认普通用户
    print('注册时收到的role:', role)

    if not username or not email or not password_plain:
        return jsonify({'message': '用户名、邮箱和密码不能为空'}), 400

    password_hash = generate_password_hash(password_plain)

    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                (username, email, password_hash, role)
            )
        conn.commit()
        return jsonify({'message': '注册成功'}), 200
    except pymysql.err.IntegrityError:
        return jsonify({'message': '用户名或邮箱已存在'}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    login_id = data.get('username') or data.get('email')  # 支持用用户名或邮箱登录
    password = data.get('password')
    role = data.get('role')  # 添加角色字段提取

    if not login_id or not password or not role:
        return jsonify({'message': '用户名/邮箱、密码和角色不能为空'}), 400

    conn = get_db()

    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:  # ✅ 记得用 DictCursor
            cursor.execute(
                "SELECT * FROM users WHERE (username=%s OR email=%s) AND role=%s",
                (login_id, login_id, role)
            )
            user = cursor.fetchone()

            if user and check_password_hash(user['password_hash'], password):
                access_token = create_access_token(identity=str(user['id']))
                return jsonify({
                    'message': '登录成功',
                    'token': access_token,
                    'user': {
                        'username': user['username'],
                        'email': user['email'],
                        'role': user['role']
                    }
                }), 200
            else:
                return jsonify({'message': '用户名、密码或权限错误'}), 401
    finally:
        conn.close()


#######################################################AdminPage########################################
# ========== 数据模型 ==========
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)  # 修改这里，且设置为非空
    role = db.Column(db.String(20), nullable=False)  # admin, user 等，建议非空

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role
        }

from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    try:
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())  # 如果你存的是字符串的用户ID
        print(user_id)
        app.logger.info(f'JWT身份：{user_id}')
    except Exception as e:
        app.logger.error(f'JWT验证失败: {e}')
        return jsonify({"msg": "无效token或未授权"}), 422

    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '用户不存在'}), 404

    return jsonify({'user': {
        'username': user.username,
        'email': user.email,
        'role': user.role
    }})


@app.route('/api/user/verify-password', methods=['POST'])
@jwt_required()
def verify_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not user or 'password' not in data:
        return jsonify({"valid": False}), 400

    is_valid = check_password_hash(user.password_hash, data['password'])
    return jsonify({"valid": is_valid})

@app.route('/api/user/update', methods=['PUT'])
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



@app.route('/api/admin/users', methods=['GET'])
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


class OperationLog(db.Model):
    __tablename__ = 'operation_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    operation = db.Column(db.String(128), nullable=False)  # 操作类型，如“新增用户: 张三”
    details = db.Column(db.Text, nullable=True)            # 详细描述
    success = db.Column(db.Boolean, default=True)          # 操作是否成功
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='logs')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "operation": self.operation,
            "details": self.details,
            "success": self.success,
            "timestamp": self.timestamp.isoformat()
        }

@app.route('/api/admin/addusers', methods=['POST'])
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

@app.route('/api/admin/logs', methods=['GET'])
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

# 删除用户接口示例
@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
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

# 更新用户接口示例
@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
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


##################################################################################################################################################################################################################

#####################################################price###########################################
@app.route('/api/fish-prices')
def get_fish_prices():
    conn =get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT fish_name, price, date FROM fish_prices ORDER BY date ASC")

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # 按鱼类分类返回 [{name: xxx, prices: [{date: xx, price: xx}, ...]}]
    fish_map = defaultdict(list)
    for row in rows:
        fish_map[row['fish_name']].append({
            'date': row['date'].strftime('%Y-%m-%d'),
            'price': row['price']
        })

    result = [{'name': name, 'prices': prices} for name, prices in fish_map.items()]
    return jsonify(result)

######################################################MainPage############################################
class WaterQuality(db.Model):
    __tablename__ = 'water_quality'

    id = db.Column(db.Integer, primary_key=True)
    province = db.Column(db.String(50))
    basin = db.Column(db.String(100))
    section_name = db.Column(db.String(100))
    monitor_time = db.Column(db.DateTime)
    water_quality_level = db.Column(db.String())
    temperature = db.Column(db.Float)
    pH = db.Column(db.Float)
    dissolved_oxygen = db.Column(db.Float)
    conductivity = db.Column(db.Integer)
    turbidity = db.Column(db.Float)
    permanganate_index = db.Column(db.Float)
    ammonia_nitrogen = db.Column(db.Float)
    total_phosphorus = db.Column(db.Float)
    total_nitrogen = db.Column(db.Float)
    chlorophyll_a = db.Column(db.String(20))
    algae_density = db.Column(db.String(20))
    station_status = db.Column(db.String())

    def to_dict(self):
        return {
            'monitor_time': self.monitor_time.isoformat() if self.monitor_time else None,
            'water_quality_level': self.water_quality_level,
            'temperature': self.temperature,
            'pH': self.pH,
            'dissolved_oxygen': self.dissolved_oxygen,
            'conductivity': self.conductivity,
            'turbidity': self.turbidity,
            'permanganate_index': self.permanganate_index,
            'ammonia_nitrogen': self.ammonia_nitrogen,
            'total_phosphorus': self.total_phosphorus,
            'total_nitrogen': self.total_nitrogen,
            'chlorophyll_a': self.chlorophyll_a,
            'algae_density': self.algae_density,
            'station_status': self.station_status
        }


class MarineFarmDevice(db.Model):
    __tablename__ = 'marine_farm_device'

    id = db.Column(db.Integer, primary_key=True)
    device_code = db.Column(db.String(50), unique=True, nullable=False)
    device_type = db.Column(db.String(100), nullable=False)
    device_version = db.Column(db.String(50), nullable=False)
    device_status = db.Column(db.String(50), nullable=False)
    install_location = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            'device_code': self.device_code,  # 修改为 device_code
            'device_type': self.device_type,
            'device_version': self.device_version,
            'device_status': self.device_status,
            'install_location': self.install_location
        }

# 新增模型类（根据sql文件字段定义）
class Location(db.Model):
    __tablename__ = 'location'

    location_id = db.Column(db.Integer, primary_key=True)
    lat = db.Column(db.DECIMAL(10,8), nullable=False)  # 对应sql中的decimal(10,8)
    lng = db.Column(db.DECIMAL(11,8), nullable=False)
    length = db.Column(db.DECIMAL(10,2), nullable=False)
    width = db.Column(db.DECIMAL(10,2), nullable=False)
    height = db.Column(db.DECIMAL(10,2), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)  # 外键关联user表（sql中已定义）

    def to_dict(self):
        return {
            'location_id': self.location_id,
            'lat': float(self.lat),  # 转为浮点数方便前端使用
            'lng': float(self.lng),
            'length': float(self.length),
            'width': float(self.width),
            'height': float(self.height)
        }

class Fish(db.Model):
    __tablename__ = 'fish'

    fish_id = db.Column(db.Integer, primary_key=True)
    Species = db.Column(db.String(255))  # 注意sql中字段名首字母大写
    Weight = db.Column(db.FLOAT)
    Length1 = db.Column(db.FLOAT)
    Length2 = db.Column(db.FLOAT)
    Length3 = db.Column(db.FLOAT)
    Height = db.Column(db.FLOAT)
    Width = db.Column(db.FLOAT)
    Location_id = db.Column(db.Integer)  # 外键关联location表

    def to_dict(self):
        return {
            'fish_id': self.fish_id,
            'Species': self.Species,
            'Weight': self.Weight,
            'Length1': self.Length1,
            'Length2': self.Length2,
            'Length3': self.Length3,
            'Height': self.Height,
            'Width': self.Width
        }


# 获取所有监测点位置信息，去重
@app.route('/api/locations', methods=['GET'])
def get_locations():
    try:
        locations = db.session.query(
            WaterQuality.section_name,
            WaterQuality.province,
            WaterQuality.basin
        ).all()

        seen = set()
        locations_list = []

        for loc in locations:
            # 先清洗字段内容（去掉空格和可能的大小写差异）
            section = loc.section_name.strip()
            province = loc.province.strip()
            basin = loc.basin.strip()

            # 用标准化后的内容去重
            key = (section, province, basin)
            if key not in seen:
                seen.add(key)
                locations_list.append({
                    "section_name": section,
                    "province": province,
                    "basin": basin
                })

        # 返回中文正常显示
        return Response(
            json.dumps({"code": 200, "data": locations_list}, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )

    except Exception as e:
        return jsonify({"code": 500, "message": str(e)})

class Farmer(db.Model):
    __tablename__ = 'farmers'
    id = db.Column(db.Integer, primary_key=True)
    farmer_name = db.Column(db.String(100), nullable=False)
    section_name = db.Column(db.String(100), nullable=False)

@app.route('/api/farmer_locations', methods=['GET'])
def get_farmer_locations():
    try:
        farmer_name = request.args.get('farmer_name', '').strip()
        if not farmer_name:
            return jsonify({"code": 400, "message": "缺少 farmer_name 参数"})

        # 查询该养殖户负责的所有 section_name
        section_names = db.session.query(Farmer.section_name).filter_by(farmer_name=farmer_name).distinct().all()
        section_names = [s.section_name.strip() for s in section_names]

        if not section_names:
            return jsonify({"code": 200, "data": []})

        # 查询唯一的 section_name, province, basin 组合
        locations = db.session.query(
            WaterQuality.section_name,
            WaterQuality.province,
            WaterQuality.basin
        ).filter(WaterQuality.section_name.in_(section_names)).distinct().all()

        # 构建返回列表
        locations_list = [
            {
                "section_name": loc.section_name.strip(),
                "province": loc.province.strip(),
                "basin": loc.basin.strip()
            }
            for loc in locations
        ]

        return Response(
            json.dumps({"code": 200, "data": locations_list}, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )

    except Exception as e:
        return jsonify({"code": 500, "message": str(e)})


# 获取指
@app.route('/api/latest-data', methods=['GET'])
def get_latest_data():
    try:
        section_name = request.args.get('section_name')
        if not section_name:
            return jsonify({"code": 400, "message": "需要提供section_name参数"})

        section_name = section_name.strip()
        print(f"Debug - 正在查询: '{section_name}'")

        latest_data = WaterQuality.query.filter(
            WaterQuality.section_name.ilike(f"%{section_name}%")
        ).order_by(
            WaterQuality.monitor_time.desc()
        ).first()

        if not latest_data:
            print(f"Debug - 未找到数据: '{section_name}'")
            return jsonify({"code": 404, "message": "未找到相关数据"})

        print(f"Debug - 最新数据: {latest_data.to_dict()}")
        return Response(
            json.dumps({"code": 200, "data": latest_data.to_dict()}, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"code": 500, "message": "服务器内部错误"})


@app.route('/api/update-temperature', methods=['POST'])
def update_temperature():
    try:
        data = request.get_json()
        section_name = data.get('section_name')
        new_temperature = data.get('temperature')

        if not section_name or new_temperature is None:
            return jsonify({"code": 400, "message": "需要提供section_name和temperature参数"})

        # 获取该断面的最新数据
        latest_data = WaterQuality.query.filter(
            WaterQuality.section_name.ilike(f"%{section_name}%")
        ).order_by(
            WaterQuality.monitor_time.desc()
        ).first()

        if not latest_data:
            return jsonify({"code": 404, "message": "未找到该断面的数据"})

        # 创建新记录（复制最新数据并更新温度）
        new_record = WaterQuality(
            province=latest_data.province,
            basin=latest_data.basin,
            section_name=latest_data.section_name,
            monitor_time=datetime.utcnow(),  # 使用当前时间
            water_quality_level=latest_data.water_quality_level,
            temperature=new_temperature,  # 更新温度
            pH=latest_data.pH,
            dissolved_oxygen=latest_data.dissolved_oxygen,
            conductivity=latest_data.conductivity,
            turbidity=latest_data.turbidity,
            permanganate_index=latest_data.permanganate_index,
            ammonia_nitrogen=latest_data.ammonia_nitrogen,
            total_phosphorus=latest_data.total_phosphorus,
            total_nitrogen=latest_data.total_nitrogen,
            chlorophyll_a=latest_data.chlorophyll_a,
            algae_density=latest_data.algae_density,
            station_status=latest_data.station_status
        )

        db.session.add(new_record)
        db.session.commit()

        return jsonify({"code": 200, "message": "温度数据更新成功", "data": new_record.to_dict()})

    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "message": f"更新失败: {str(e)}"})


# @app.route('/api/update-ph', methods=['POST'])
# def update_ph():
#     try:
#         data = request.get_json()
#         section_name = data.get('section_name')
#         new_ph = data.get('pH')
#
#         if not section_name or new_ph is None:
#             return jsonify({"code": 400, "message": "需要提供section_name和pH参数"})
#
#         # 获取该断面的最新数据
#         latest_data = WaterQuality.query.filter(
#             WaterQuality.section_name.ilike(f"%{section_name}%")
#         ).order_by(
#             WaterQuality.monitor_time.desc()
#         ).first()
#
#         if not latest_data:
#             return jsonify({"code": 404, "message": "未找到该断面的数据"})
#
#         # 创建新记录（复制最新数据并更新pH值）
#         new_record = WaterQuality(
#             province=latest_data.province,
#             basin=latest_data.basin,
#             section_name=latest_data.section_name,
#             monitor_time=datetime.utcnow(),  # 使用当前时间
#             water_quality_level=latest_data.water_quality_level,
#             temperature=latest_data.temperature,
#             pH=new_ph,  # 更新pH值
#             dissolved_oxygen=latest_data.dissolved_oxygen,
#             conductivity=latest_data.conductivity,
#             turbidity=latest_data.turbidity,
#             permanganate_index=latest_data.permanganate_index,
#             ammonia_nitrogen=latest_data.ammonia_nitrogen,
#             total_phosphorus=latest_data.total_phosphorus,
#             total_nitrogen=latest_data.total_nitrogen,
#             chlorophyll_a=latest_data.chlorophyll_a,
#             algae_density=latest_data.algae_density,
#             station_status=latest_data.station_status
#         )
#
#         db.session.add(new_record)
#         db.session.commit()
#
#         return jsonify({"code": 200, "message": "pH值更新成功", "data": new_record.to_dict()})
#
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"code": 500, "message": f"更新失败: {str(e)}"})
#




@app.route('/api/update-dissolved-oxygen', methods=['POST'])
def update_dissolved_oxygen():
    try:
        data = request.get_json()
        section_name = data.get('section_name')
        new_do = data.get('dissolved_oxygen')

        if not section_name or new_do is None:
            return jsonify({
                "code": 400,
                "message": "需要提供section_name和dissolved_oxygen参数"
            })

        # 获取该断面的最新数据
        latest_data = WaterQuality.query.filter(
            WaterQuality.section_name.ilike(f"%{section_name}%")
        ).order_by(
            WaterQuality.monitor_time.desc()
        ).first()

        if not latest_data:
            return jsonify({
                "code": 404,
                "message": "no find"
            })

        # 创建新记录
        new_record = WaterQuality(
            province=latest_data.province,
            basin=latest_data.basin,
            section_name=latest_data.section_name,
            monitor_time=datetime.utcnow(),
            water_quality_level=latest_data.water_quality_level,
            temperature=latest_data.temperature,
            pH=latest_data.pH,
            dissolved_oxygen=new_do,
            conductivity=latest_data.conductivity,
            turbidity=latest_data.turbidity,
            permanganate_index=latest_data.permanganate_index,
            ammonia_nitrogen=latest_data.ammonia_nitrogen,
            total_phosphorus=latest_data.total_phosphorus,
            total_nitrogen=latest_data.total_nitrogen,
            chlorophyll_a=latest_data.chlorophyll_a,
            algae_density=latest_data.algae_density,
            station_status=latest_data.station_status
        )

        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            "code": 200,
            "message": "溶解氧数据更新成功",
            "data": new_record.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "code": 500,
            "message": f"更新失败: {str(e)}"
        })




@app.route('/api/range-data', methods=['GET'])
def get_range_data():
    try:
        section_name = request.args.get('section_name')
        start_time_str = request.args.get('start_time')
        end_time_str = request.args.get('end_time')

        if not section_name or not start_time_str or not end_time_str:
            return jsonify({"code": 400, "message": "需要提供 section_name、start_time 和 end_time 参数"})

        section_name = section_name.strip()

        # 解析时间字符串
        try:
            start_time = datetime.fromisoformat(start_time_str)
            end_time = datetime.fromisoformat(end_time_str)
        except ValueError:
            return jsonify({"code": 400, "message": "时间格式错误，需为 YYYY-MM-DDTHH:MM:SS"})

        # 查询符合条件的数据（模糊匹配 + 时间范围）
        records = WaterQuality.query.filter(
            WaterQuality.section_name.ilike(f"%{section_name}%"),
            WaterQuality.monitor_time >= start_time,
            WaterQuality.monitor_time <= end_time
        ).order_by(WaterQuality.monitor_time.asc()).all()

        if not records:
            return jsonify({"code": 404, "message": "未找到该时间段内的数据"})

        result = [record.to_dict() for record in records]

        return Response(
            json.dumps({"code": 200, "data": result}, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"code": 500, "message": "服务器内部错误"})


@app.route('/api/device-info', methods=['GET'])
def get_device_info():
    install_location = request.args.get('install_location')

    if not install_location:
        return jsonify({"code": 400, "message": "需要提供 install_location 参数"})

    install_location = install_location.strip()
    print(f"Debug - 正在查询安装位置: '{install_location}'")

    try:
        # 使用 filter() 而不是 filter_by()，这样可以进一步处理复杂的查询逻辑
        devices = MarineFarmDevice.query.filter(MarineFarmDevice.install_location == install_location).all()

        if not devices:
            return jsonify({"code": 404, "message": "未找到相关设备"})

        devices_list = [device.to_dict() for device in devices]

        return Response(
            json.dumps({"code": 200, "data": devices_list}, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )
    except Exception as e:
        print(e)  # 输出异常信息
        return jsonify({"code": 500, "message": "服务器内部错误"})


# 新增接口：获取用户拥有的牧场（需用户登录后传递user_id）
@app.route('/api/user-locations', methods=['GET'])
def get_user_locations():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"code": 400, "message": "请提供user_id参数"})
        print(f"User ID: {user_id}")
        locations = Location.query.filter_by(user_id=user_id).all()

        return Response(
            #json.dumps({"code": 200, "data": locations[0].to_dict()}, ensure_ascii=False),
            json.dumps({"code": 200, "data": [loc.to_dict() for loc in locations]}, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )
    except Exception as e:
        return jsonify({"code": 500, "message": str(e)})

# 新增接口：获取指定牧场的鱼类统计（种类占比+身长分布）
@app.route('/api/location-fish-stats', methods=['GET'])
def get_location_fish_stats():
    try:
        location_id = request.args.get('location_id')
        print("location_id: ",location_id)
        if not location_id:
            return jsonify({"code": 400, "message": "请提供location_id参数"})

        # 1. 查询该牧场所有鱼类数据
        fish_list = Fish.query.filter_by(Location_id=location_id).all()
        if not fish_list:
            return jsonify({"code": 404, "message": "no fish here"})

        # 2. 统计种类占比（使用SQL聚合函数）
        species_counts = db.session.query(
            Fish.Species,
            func.count(Fish.fish_id).label('count')
        ).filter_by(Location_id=location_id).group_by(Fish.Species).all()

        # 3. 统计各品种平均身长（取Length1、Length2、Length3的平均值）
        species_length_avg = db.session.query(
            Fish.Species,
            func.avg(Fish.Length1).label('avg_length1'),
            func.avg(Fish.Length2).label('avg_length2'),
            func.avg(Fish.Length3).label('avg_length3')
        ).filter_by(Location_id=location_id).group_by(Fish.Species).all()

        # 4. 新增重量统计（各品种平均重量）
        species_weight_avg = db.session.query(
            Fish.Species,
            func.avg(Fish.Weight).label('avg_weight')
        ).filter_by(Location_id=location_id).group_by(Fish.Species).all()

        return Response(
            json.dumps({
                "code": 200,
                "data": {
                    "location_info": Location.query.get(location_id).to_dict(),  # 牧场基础信息
                    "fish_count": len(fish_list),  # 总鱼数
                    "species_ratio": [{"type": sc.Species, "value": sc.count} for sc in species_counts],  # 种类占比数据（饼图用）
                    "length_distribution": [  # 身长分布数据（柱状图用）
                        {
                            "species": sla.Species,
                            "avg_length1": float(sla.avg_length1) if sla.avg_length1 else 0,
                            "avg_length2": float(sla.avg_length2) if sla.avg_length2 else 0,
                            "avg_length3": float(sla.avg_length3) if sla.avg_length3 else 0
                        } for sla in species_length_avg
                    ],
                    "weight_distribution": [  # 新增重量分布数据
                        {
                            "species": swa.Species,
                            "avg_weight": float(swa.avg_weight) if swa.avg_weight else 0
                        } for swa in species_weight_avg
                    ]
                }
            }, ensure_ascii=False),
            content_type='application/json; charset=utf-8'
        )
    except Exception as e:
        return jsonify({"code": 500, "message": str(e)})



# ------------------------------------------------------------------------
# -------------------------------------------------------------------------
# 智能决策获取
#  后端 API 端点：获取 AI 建议
# 替换为你的实际 AI 模型 API 地址
from openai import OpenAI


client = OpenAI(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx",
    api_key="sk-b6bb661e82b94e96ba90d7c5bb09ca44",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

@app.route('/api/get-advice', methods=['POST'])
def get_advice():
    # 获取请求中的气象数据
    data = request.get_json()

    # 检查必要的气象数据是否存在
    temperature = data.get('temperature')
    windspeed = data.get('windspeed')
    winddirection = data.get('winddirection')

    if not temperature or not windspeed or not winddirection:
        return jsonify({'error': '缺少必要的气象数据'}), 400

    try:
        # 调用 AI 模型 API
        completion = client.chat.completions.create(
        # 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        model="qwen-plus",
        messages = [
            {"role": "system", "content": "回答不超过50个字！！你是一个养殖渔场的专家，你会通过天气信息和渔场的水文信息给养鱼养殖户智能建议。回答少于50个字！！。"},
            {"role": "user", "content": f"当前温度是 {temperature}℃，风速是 {windspeed} km/h，风向是 {winddirection}°"},  # 示例问题
        ],

)
        # 检查响应中是否包含 choices 和 message
        if completion.choices and len(completion.choices) > 0:
            advice = completion.choices[0].message.content
            return jsonify({'advice': advice})
        else:
            return jsonify({'error': 'AI 模型未返回有效建议'}), 500

    except Exception as e:
        # 处理调用 OpenAI API 时的异常
        print(f'Error calling OpenAI API: {e}')
        return jsonify({'error': '获取建议失败，请稍后重试'}), 500


#
# @app.route('/api/water-data', methods=['GET'])
# def get_water_data():
#     try:
#         # 获取前端传递的站点名称参数
#         section_name = request.args.get('station')
#         if not section_name:
#             return jsonify({"code": 400, "message": "需要提供 station 参数"}), 400
#
#         # 查询指定站点的最新水文数据
#         latest_water_data = WaterQuality.query.filter_by(section_name=section_name).order_by(WaterQuality.monitor_time.desc()).first()
#
#         if not latest_water_data:
#             return jsonify({"code": 404, "message": f"站点 '{section_name}' 暂无数据"}), 404
#
#         # 构造返回数据
#         water_data = {
#             "dissolved_oxygen": latest_water_data.dissolved_oxygen,
#             "turbidity": latest_water_data.turbidity,
#             "pH": latest_water_data.pH,
#             "temperature": latest_water_data.temperature
#         }
#
#         return jsonify({
#             "code": 200,
#             "data": water_data
#         })
#
#     except Exception as e:
#         return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"}), 500


# @app.route('/')
# def index():
#     return 'Flask + XAMPP MySQL 连接成功！'


if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)  # 禁用自动重载，这样更容易调试

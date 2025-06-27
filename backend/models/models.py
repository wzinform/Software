from extensions import db
from datetime import datetime

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


class Farmer(db.Model):
    __tablename__ = 'farmers'
    id = db.Column(db.Integer, primary_key=True)
    farmer_name = db.Column(db.String(100), nullable=False)
    section_name = db.Column(db.String(100), nullable=False)
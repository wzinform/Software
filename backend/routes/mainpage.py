from flask import Blueprint, request, jsonify
from models.models import WaterQuality,Farmer,MarineFarmDevice
from extensions import db
from flask import Response
import json
from datetime import datetime

from openai import OpenAI
# 如果是其他模型，请替换导入

mainpage = Blueprint('mainpage', __name__)
# 获取所有监测点位置信息，去重
@mainpage.route('/api/locations', methods=['GET'])

def get_locations():
    """
        获取指定养殖户负责的监测点位置信息
        ---
        tags:
          - 养殖户管理
        parameters:
          - name: farmer_name
            in: query
            type: string
            required: true
            description: 养殖户姓名
        responses:
          200:
            description: 返回养殖户负责的监测点列表
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                data:
                  type: array
                  items:
                    type: object
                    properties:
                      section_name:
                        type: string
                        example: "长江大桥断面"
                      province:
                        type: string
                        example: "江苏省"
                      basin:
                        type: string
                        example: "长江流域"
          400:
            description: 缺少必要参数
          500:
            description: 服务器内部错误
        """
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

    
@mainpage.route('/api/farmer_locations', methods=['GET'])
def get_farmer_locations():
    """
        获取指定养殖户负责的监测点位置信息
        ---
        tags:
          - 养殖户管理
        parameters:
          - name: farmer_name
            in: query
            type: string
            required: true
            description: 养殖户姓名
        responses:
          200:
            description: 返回养殖户负责的监测点列表
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                data:
                  type: array
                  items:
                    type: object
                    properties:
                      section_name:
                        type: string
                        example: "长江大桥断面"
                      province:
                        type: string
                        example: "江苏省"
                      basin:
                        type: string
                        example: "长江流域"
          400:
            description: 缺少必要参数
          500:
            description: 服务器内部错误
        """
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
@mainpage.route('/api/latest-data', methods=['GET'])
def get_latest_data():
    """
        获取指定监测点的最新水质数据
        ---
        tags:
          - 水质数据
        parameters:
          - name: section_name
            in: query
            type: string
            required: true
            description: 监测点名称（支持模糊查询）
        responses:
          200:
            description: 返回最新水质数据
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                data:
                  $ref: '#/definitions/WaterQuality'
          400:
            description: 缺少必要参数
          404:
            description: 未找到相关数据
          500:
            description: 服务器内部错误
        """
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




@mainpage.route('/api/range-data', methods=['GET'])
def get_range_data():
    """
        获取指定监测点在时间范围内的水质数据
        ---
        tags:
          - 水质数据
        parameters:
          - name: section_name
            in: query
            type: string
            required: true
            description: 监测点名称
          - name: start_time
            in: query
            type: string
            required: true
            description: 开始时间（ISO格式，如2024-05-01T00:00:00）
          - name: end_time
            in: query
            type: string
            required: true
            description: 结束时间（ISO格式，如2024-05-31T23:59:59）
        responses:
          200:
            description: 返回时间范围内的水质数据列表
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                data:
                  type: array
                  items:
                    $ref: '#/definitions/WaterQuality'
          400:
            description: 缺少必要参数或时间格式错误
          404:
            description: 未找到相关数据
          500:
            description: 服务器内部错误
        """
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


@mainpage.route('/api/device-info', methods=['GET'])
def get_device_info():
    """
        获取指定安装位置的设备信息
        ---
        tags:
          - 设备管理
        parameters:
          - name: install_location
            in: query
            type: string
            required: true
            description: 设备安装位置（精确匹配）
        responses:
          200:
            description: 返回设备列表
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                data:
                  type: array
                  items:
                    $ref: '#/definitions/MarineFarmDevice'
          400:
            description: 缺少必要参数
          404:
            description: 未找到相关设备
          500:
            description: 服务器内部错误
        """
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



@mainpage.route('/api/update-temperature', methods=['POST'])
def update_temperature():
    """
        更新监测点温度数据（创建新记录）
        ---
        tags:
          - 数据更新
        parameters:
          - name: body
            in: body
            required: true
            schema:
              type: object
              properties:
                section_name:
                  type: string
                  example: "长江大桥断面"
                temperature:
                  type: number
                  example: 25.5
        responses:
          200:
            description: 温度更新成功
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                message:
                  type: string
                data:
                  $ref: '#/definitions/WaterQuality'
          400:
            description: 缺少必要参数
          404:
            description: 未找到该断面的数据
          500:
            description: 更新失败
        """
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


@mainpage.route('/api/update-ph', methods=['POST'])
def update_ph():
    """
        更新监测点pH值数据（创建新记录）
        ---
        tags:
          - 数据更新
        parameters:
          - name: body
            in: body
            required: true
            schema:
              type: object
              properties:
                section_name:
                  type: string
                  example: "长江大桥断面"
                pH:
                  type: number
                  example: 7.5
        responses:
          200:
            description: pH值更新成功
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                message:
                  type: string
                data:
                  $ref: '#/definitions/WaterQuality'
          400:
            description: 缺少必要参数
          404:
            description: 未找到该断面的数据
          500:
            description: 更新失败
        """
    try:
        data = request.get_json()
        section_name = data.get('section_name')
        new_ph = data.get('pH')

        if not section_name or new_ph is None:
            return jsonify({"code": 400, "message": "需要提供section_name和pH参数"})

        # 获取该断面的最新数据
        latest_data = WaterQuality.query.filter(
            WaterQuality.section_name.ilike(f"%{section_name}%")
        ).order_by(
            WaterQuality.monitor_time.desc()
        ).first()

        if not latest_data:
            return jsonify({"code": 404, "message": "未找到该断面的数据"})

        # 创建新记录（复制最新数据并更新pH值）
        new_record = WaterQuality(
            province=latest_data.province,
            basin=latest_data.basin,
            section_name=latest_data.section_name,
            monitor_time=datetime.utcnow(),  # 使用当前时间
            water_quality_level=latest_data.water_quality_level,
            temperature=latest_data.temperature,
            pH=new_ph,  # 更新pH值
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

        return jsonify({"code": 200, "message": "pH值更新成功", "data": new_record.to_dict()})

    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "message": f"更新失败: {str(e)}"})





@mainpage.route('/api/update-dissolved-oxygen', methods=['POST'])
def update_dissolved_oxygen():
    """
        更新监测点溶解氧数据（创建新记录）
        ---
        tags:
          - 数据更新
        parameters:
          - name: body
            in: body
            required: true
            schema:
              type: object
              properties:
                section_name:
                  type: string
                  example: "长江大桥断面"
                dissolved_oxygen:
                  type: number
                  example: 8.2
        responses:
          200:
            description: 溶解氧更新成功
            schema:
              type: object
              properties:
                code:
                  type: integer
                  example: 200
                message:
                  type: string
                data:
                  $ref: '#/definitions/WaterQuality'
          400:
            description: 缺少必要参数
          404:
            description: 未找到该断面的数据
          500:
            description: 更新失败
        """
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
                "message": "未找到该断面的数据"
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






client = OpenAI(
    api_key="sk-9XTIk4VbicWxiGjN99eTZ4Lx7cNQRk4JLxJex2hhnrXNaQEJ",
    base_url="https://yunwu.ai/v1"
)

@mainpage.route('/api/quality-advice', methods=['GET'])
def get_quality_advice():
    """
       获取指定监测点的水质改善建议（基于AI分析）
       ---
       tags:
         - AI建议
       parameters:
         - name: section_name
           in: query
           type: string
           required: true
           description: 监测点名称
       responses:
         200:
           description: 返回水质分析建议
           schema:
             type: object
             properties:
               code:
                 type: integer
                 example: 200
               data:
                 type: object
                 properties:
                   water_quality:
                     $ref: '#/definitions/WaterQuality'
                   advice:
                     type: string
                     example: "当前水质适宜养殖，建议保持现有管理措施..."
         400:
           description: 缺少必要参数
         404:
           description: 未找到该断面的数据
         500:
           description: 生成建议失败
       """
    try:
        section_name = request.args.get('section_name')
        if not section_name:
            return jsonify({"code": 400, "message": "需要提供 section_name 参数"})

        section_name = section_name.strip()

        # 获取该断面最新数据
        latest_data = WaterQuality.query.filter(
            WaterQuality.section_name.ilike(f"%{section_name}%")
        ).order_by(WaterQuality.monitor_time.desc()).first()

        if not latest_data:
            return jsonify({"code": 404, "message": "未找到该断面的数据"})

        data_dict = latest_data.to_dict()

        # 构造提示词
        prompt = f"""
你是一名水产养殖专家。根据以下水质数据，请判断水质是否适宜养殖，并提出优化建议。

断面：{section_name}
时间：{data_dict.get('monitor_time')}
温度：{data_dict.get('temperature')}℃
pH值：{data_dict.get('pH')}
溶解氧：{data_dict.get('dissolved_oxygen')}
电导率：{data_dict.get('conductivity')}
浊度：{data_dict.get('turbidity')}
高锰酸盐指数：{data_dict.get('permanganate_index')}
氨氮：{data_dict.get('ammonia_nitrogen')}
总磷：{data_dict.get('total_phosphorus')}
总氮：{data_dict.get('total_nitrogen')}
叶绿素a：{data_dict.get('chlorophyll_a')}
藻密度：{data_dict.get('algae_density')}

请用简明中文回答，字数控制在200字以内。
"""

        # 使用新版 SDK 发起请求
        response = client.chat.completions.create(
            model="deepseek-chat",  # 自定义模型
            messages=[
                {"role": "system", "content": "你是专业的水质养殖顾问"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=400
        )

        import re

        raw_content = response.choices[0].message.content
        # 去除 <think>...</think> 标签及其中内容
        advice = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()

        return jsonify({
            "code": 200,
            "data": {
                "water_quality": data_dict,
                "advice": advice
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"code": 500, "message": f"生成建议失败: {str(e)}"})

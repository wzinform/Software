from flask import Blueprint, request, jsonify
from models.models import Location,Fish
from extensions import db
from flask import Response
import json
from sqlalchemy import func  


underwater = Blueprint('underwater', __name__)
# 新增接口：获取用户拥有的牧场（需用户登录后传递user_id）
@underwater.route('/api/user-locations', methods=['GET'])
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
@underwater.route('/api/location-fish-stats', methods=['GET'])
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

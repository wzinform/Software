from openai import OpenAI
from flask import Blueprint, request, jsonify
from models.models import WaterQuality

aicenter = Blueprint('aicenter', __name__)

client = OpenAI(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx",
    api_key="sk-b6bb661e82b94e96ba90d7c5bb09ca44",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

@aicenter.route('/api/get-advice', methods=['POST'])
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



@aicenter.route('/api/water-data', methods=['GET'])
def get_water_data():
    try:
        # 获取前端传递的站点名称参数
        section_name = request.args.get('station')
        if not section_name:
            return jsonify({"code": 400, "message": "需要提供 station 参数"}), 400

        # 查询指定站点的最新水文数据
        latest_water_data = WaterQuality.query.filter_by(section_name=section_name).order_by(WaterQuality.monitor_time.desc()).first()

        if not latest_water_data:
            return jsonify({"code": 404, "message": f"站点 '{section_name}' 暂无数据"}), 404

        # 构造返回数据
        water_data = {
            "dissolved_oxygen": latest_water_data.dissolved_oxygen,
            "turbidity": latest_water_data.turbidity,
            "pH": latest_water_data.pH,
            "temperature": latest_water_data.temperature
        }

        return jsonify({
            "code": 200,
            "data": water_data
        })

    except Exception as e:
        return jsonify({"code": 500, "message": f"服务器错误: {str(e)}"}), 500

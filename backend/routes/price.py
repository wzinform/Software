from flask import Blueprint, jsonify
from collections import defaultdict
from services.db_utils import get_db

price = Blueprint('price', __name__)

@price.route('/api/fish-prices')
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
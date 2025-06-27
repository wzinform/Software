import json
import pymysql
from tqdm import tqdm
import numpy as np
from datetime import datetime
import os


def clean_value(value):
    """清洗数据值，处理空值和格式，特别处理星号(*)"""
    if value in ["--", "", None, "null", "NULL", "*"]:
        return None
    if isinstance(value, str) and value.startswith("<span"):
        # 提取<span title='原始值：X.XXX'>X.XX</span>中的值
        try:
            # 提取显示值
            display_value = value.split(">")[1].split("<")[0]
            # 尝试转换为float，失败则返回原字符串
            try:
                return float(display_value)
            except ValueError:
                return display_value
        except:
            return None
    # 尝试转换为float，失败则返回原字符串
    try:
        return float(value)
    except (ValueError, TypeError):
        return str(value) if value is not None else None


def process_json_file(file_path, db_config, sql):
    """处理单个JSON文件并导入数据库"""
    try:
        # 读取JSON数据
        with open(file_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)

        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()

        # 处理每条记录
        for record in tqdm(json_data["tbody"], desc=f"处理文件: {os.path.basename(file_path)}"):
            try:
                # 处理监测时间，统一设置为2024年
                try:
                    monitor_time = datetime.strptime(record[3], "%m-%d %H:%M").replace(year=2025)
                except:
                    monitor_time = None

                # 构建数据字典，确保每个字段都有默认值None
                data = {
                    "province": clean_value(record[0]) if len(record) > 0 else None,
                    "basin": clean_value(record[1]) if len(record) > 1 else None,
                    "section_name": clean_value(record[2]) if len(record) > 2 else None,
                    "monitor_time": monitor_time,
                    "water_quality_level": clean_value(record[4]) if len(record) > 4 else None,
                    "temperature": clean_value(record[5]) if len(record) > 5 else None,
                    "pH": clean_value(record[6]) if len(record) > 6 else None,
                    "dissolved_oxygen": clean_value(record[7]) if len(record) > 7 else None,
                    "conductivity": clean_value(record[8]) if len(record) > 8 else None,
                    "turbidity": clean_value(record[9]) if len(record) > 9 else None,
                    "permanganate_index": clean_value(record[10]) if len(record) > 10 else None,
                    "ammonia_nitrogen": clean_value(record[11]) if len(record) > 11 else None,
                    "total_phosphorus": clean_value(record[12]) if len(record) > 12 else None,
                    "total_nitrogen": clean_value(record[13]) if len(record) > 13 else None,
                    "chlorophyll_a": clean_value(record[14]) if len(record) > 14 else None,
                    "algae_density": clean_value(record[15]) if len(record) > 15 else None,
                    "station_status": clean_value(record[16]) if len(record) > 16 else None
                }

                # 执行SQL插入
                cursor.execute(sql, (
                    data["province"],
                    data["basin"],
                    data["section_name"],
                    data["monitor_time"],
                    data["water_quality_level"],
                    data["temperature"],
                    data["pH"],
                    data["dissolved_oxygen"],
                    data["conductivity"],
                    data["turbidity"],
                    data["permanganate_index"],
                    data["ammonia_nitrogen"],
                    data["total_phosphorus"],
                    data["total_nitrogen"],
                    data["chlorophyll_a"],
                    data["algae_density"],
                    data["station_status"]
                ))

            except Exception as e:
                print(f"\n处理记录失败：{record}")
                print(f"错误信息：{str(e)}")
                connection.rollback()
                continue

        connection.commit()
        cursor.close()
        connection.close()

    except Exception as e:
        print(f"\n处理文件失败：{file_path}")
        print(f"错误信息：{str(e)}")


def process_json_files(folder_path, db_config, sql):
    """处理文件夹中的所有JSON文件"""
    # 获取文件夹中所有JSON文件
    json_files = []
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".json"):
                json_files.append(os.path.join(root, file))

    if not json_files:
        print(f"在文件夹 {folder_path} 中没有找到JSON文件")
        return

    print(f"找到 {len(json_files)} 个JSON文件，开始导入...")

    # 处理每个JSON文件
    for json_file in json_files:
        process_json_file(json_file, db_config, sql)

    print("所有JSON文件已批量导入完成！")


if __name__ == "__main__":
    # 数据库配置
    DB_CONFIG = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "ocean_farm",
        "charset": "utf8mb4"
    }

    # SQL插入语句
    SQL = """
    INSERT INTO water_quality (
        province, basin, section_name, monitor_time,
        water_quality_level, temperature, pH, dissolved_oxygen,
        conductivity, turbidity, permanganate_index,
        ammonia_nitrogen, total_phosphorus, total_nitrogen,
        chlorophyll_a, algae_density, station_status
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # # JSON文件夹路径
    # JSON_FOLDER_PATH = "D:/桌面/软件工程/f7ee1bebe4a9404083f70b4961b92c86 (1)/软件工程大作业数据/水质数据/2021-03"
    #
    # # 处理并导入数据
    # process_json_files(JSON_FOLDER_PATH, DB_CONFIG, SQL)
    print("finish!")
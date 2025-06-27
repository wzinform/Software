# import os
# import pandas as pd
# import pymysql
# from tqdm import tqdm  # 进度条工具，可选安装
#
#
# def process_csv_files(root_dir, db_config,sql):
#     """
#     批量处理水质CSV文件并导入数据库
#     :param root_dir: CSV文件根目录（water_quality_by_name）
#     :param db_config: 数据库配置字典
#     """
#     # 连接数据库（全局保持一个连接）
#     connection = pymysql.connect(**db_config)
#     cursor = connection.cursor()
#
#     # 遍历所有CSV文件
#     csv_files = []
#     for root, dirs, files in os.walk(root_dir):
#         for file in files:
#             if file.endswith(".csv"):
#                 csv_files.append(os.path.join(root, file))
#
#     # 进度条（需要安装tqdm库）
#     for csv_path in tqdm(csv_files, desc="处理文件中"):
#         try:
#             # 从路径提取年份（假设父目录为 2021-04 格式）
#             parent_dir = os.path.basename(os.path.dirname(csv_path))
#             # if '-' in parent_dir:
#             #     year = parent_dir.split('-')[0]
#             # else:
#             year = "2025"  # 默认年份
#
#             # 读取CSV
#             df = pd.read_csv(csv_path, encoding='utf-8')
#
#             # 处理监测时间（自动补全年份）
#             df["监测时间"] = df["监测时间"].astype(str).str.strip()
#             df["监测时间"] = year + '-' + df["监测时间"]
#             df["监测时间"] = pd.to_datetime(
#                 df["监测时间"],
#                 format="%Y-%m-%d %H:%M",
#                 errors="coerce"
#             )
#
#             # 清理无效数据
#             for col in ["叶绿素α(mg/L)", "藻密度(cells/L)"]:
#                 if col in df.columns:
#                     df[col] = df[col].apply(lambda x: None if x == "*" else x)
#
#             # 插入数据库
#             for _, row in df.iterrows():
#                 # 确保所有字段存在（处理不同CSV的列差异）
#                 values = (
#                     row.get("省份", ""),  # 如果列不存在返回空字符串
#                     row.get("流域", ""),
#                     row.get("断面名称", ""),
#                     row["监测时间"],  # 必须存在的字段
#                     row.get("水质类别", None),
#                     row.get("(℃)", None),
#                     row.get("(无量纲)", None),
#                     row.get("(mg/L)", None),
#                     row.get("(μS/cm)", None),
#                     row.get("(NTU)", None),
#                     row.get("(mg/L)", None),
#                     row.get("(mg/L)", None),
#                     row.get("(mg/L)", None),
#                     row.get("(mg/L)", None),
#                     row.get("(mg/L)", None),
#                     row.get("(cells/L)", None),
#                     row.get("站点情况", None)
#                 )
#                 cursor.execute(sql, values)
#
#             connection.commit()  # 每个文件提交一次
#
#         except Exception as e:
#             print(f"\n处理文件失败：{csv_path}")
#             print(f"错误信息：{str(e)}")
#             connection.rollback()  # 回滚当前文件的事务
#
#     # 关闭连接
#     cursor.close()
#     connection.close()
#
#
# if __name__ == "__main__":
#     # 配置参数
#     DB_CONFIG = {
#         "host": "localhost",
#         "user": "root",
#         "password": "",
#         "database": "ocean_farm",
#         "charset": "utf8mb4"
#     }
#
#     SQL = """
#     INSERT INTO water_quality (
#         province, basin, section_name, monitor_time,
#         water_quality_level, temperature, pH, dissolved_oxygen,
#         conductivity, turbidity, permanganate_index,
#         ammonia_nitrogen, total_phosphorus, total_nitrogen,
#         chlorophyll_a, algae_density, station_status
#     ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#     """
#
#     # 指定根目录（根据实际情况修改）
#     ROOT_DIR = "D:/桌面/1"
#
#     # 执行批量导入
#     process_csv_files(ROOT_DIR, DB_CONFIG,SQL)
#     print("所有数据已批量导入完成！")





import os
import pandas as pd
import pymysql
from tqdm import tqdm
import numpy as np


def clean_row(row):
    """
    将 row 中的 NaN 转为 None
    """
    return [None if pd.isna(x) else x for x in row]


def process_csv_files(root_dir, db_config, sql):
    connection = pymysql.connect(**db_config)
    cursor = connection.cursor()

    csv_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".csv"):
                csv_files.append(os.path.join(root, file))

    for csv_path in tqdm(csv_files, desc="处理文件中"):
        try:
            parent_dir = os.path.basename(os.path.dirname(csv_path))
            year = "2025"

            # 读取 CSV
            df = pd.read_csv(csv_path, encoding='utf-8')

            # 替换 "--" 为 None（也可以换为 np.nan 再统一处理）
            df.replace("--", np.nan, inplace=True)

            # 处理时间
            df["监测时间"] = df["监测时间"].astype(str).str.strip()
            df["监测时间"] = year + '-' + df["监测时间"]
            df["监测时间"] = pd.to_datetime(
                df["监测时间"],
                format="%Y-%m-%d %H:%M",
                errors="coerce"
            )

            for _, row in df.iterrows():
                values = (
                    row.get("省份", ""),
                    row.get("流域", ""),
                    row.get("断面名称", ""),
                    row["监测时间"],
                    row.get("水质类别", None),
                    row.get("(℃)", None),
                    row.get("(无量纲)", None),
                    row.get("(mg/L)", None),
                    row.get("(μS/cm)", None),
                    row.get("(NTU)", None),
                    row.get("(mg/L)", None),
                    row.get("(mg/L)", None),
                    row.get("(mg/L)", None),
                    row.get("(mg/L)", None),
                    row.get("(mg/L)", None),
                    row.get("(cells/L)", None),
                    row.get("站点情况", None)
                )

                values = clean_row(values)  # <- 添加清洗 NaN 的函数
                cursor.execute(sql, values)

            connection.commit()

        except Exception as e:
            print(f"\n处理文件失败：{csv_path}")
            print(f"错误信息：{str(e)}")
            connection.rollback()

    cursor.close()
    connection.close()


if __name__ == "__main__":
    DB_CONFIG = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "ocean_farm",
        "charset": "utf8mb4"
    }

    SQL = """
    INSERT INTO water_quality (
        province, basin, section_name, monitor_time,
        water_quality_level, temperature, pH, dissolved_oxygen,
        conductivity, turbidity, permanganate_index,
        ammonia_nitrogen, total_phosphorus, total_nitrogen,
        chlorophyll_a, algae_density, station_status
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    ROOT_DIR = "D:/桌面/1"
    process_csv_files(ROOT_DIR, DB_CONFIG, SQL)
    print("所有数据已批量导入完成！")




import json
import csv
import re
import os

# HTML 清洗函数
# HTML 清洗 + 替换 '--' 为 '*'
def clean_html(cell):
    if isinstance(cell, str):
        # 提取 HTML 标签中的内容
        match = re.search(r'>([^<]+)<', cell)
        text = match.group(1).strip() if match else re.sub(r'<[^>]*>', '', cell).strip()
        return '*' if text == '--' else text
    return cell

# 设置输入文件夹路径和输出文件名
input_folder = 'D:/桌面/软件工程/f7ee1bebe4a9404083f70b4961b92c86 (1)/软件工程大作业数据/水质数据/2020-05'  # 你可以改为你的 JSON 文件夹路径
output_filename = 'D:/桌面/软件工程/f7ee1bebe4a9404083f70b4961b92c86 (1)/软件工程大作业数据/水质数据/2020-05/out2.csv'

# 初始化数据集合
merged_rows = []
header_written = False
csv_headers = []

# 遍历文件夹中所有 JSON 文件
for filename in os.listdir(input_folder):
    if filename.endswith('.json'):
        file_path = os.path.join(input_folder, filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                thead = data.get("thead", [])
                tbody = data.get("tbody", [])

                # 清洗表头
                cleaned_thead = [clean_html(header) for header in thead]

                # 只在第一次写入表头
                if not header_written:
                    csv_headers = cleaned_thead
                    header_written = True

                # 清洗表体
                cleaned_rows = [[clean_html(cell) for cell in row] for row in tbody]
                merged_rows.extend(cleaned_rows)

                print(f"✅ 已处理：{filename}")

            except Exception as e:
                print(f"⚠️ 读取文件 {filename} 出错: {e}")

# 写入到 CSV
with open(output_filename, 'w', encoding='utf-8-sig', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(csv_headers)
    writer.writerows(merged_rows)
print("脚本结束！")
print(f"\n🎉 所有 JSON 文件已导出到：{output_filename}")

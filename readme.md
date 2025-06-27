# Ocean Farm 项目启动说明

## 📦 数据库初始化  

1. 创建数据库（使用 MySQL）：
```sql
   CREATE DATABASE ocean_farm;
```

2. 导入数据：
```bash
   mysql -u your_username -p ocean_farm < ocean_farm.sql
```
## ⚙️ 项目启动
1. 创建并激活 Python 虚拟环境：
```bash
   python3 -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
```

2. 启动后端 Flask 服务：
```bash
   cd backend
   flask run
```
3. 启动前端 React 应用：
```bash
   cd frontend
   npm install  # 第一次运行需要安装依赖
   npm start
```
## ✅ 项目结构说明

* `ocean_farm.sql`：数据库结构和数据
* `backend/`：Flask 后端代码
* `frontend/`：React 前端项目
* `venv/`：Python 虚拟环境目录（不包含在 Git 中）
  
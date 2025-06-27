# SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:root@localhost/ocean_farm'
# 1. 密码留空写法（注意冒号后面没有密码）
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost/ocean_farm'
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ECHO = True
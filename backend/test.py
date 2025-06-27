import requests

url = "http://localhost:5000/api/update-dissolved-oxygen"
payload = {
    "section_name": "忠庙",
    "dissolved_oxygen": 6.5
}

response = requests.post(url, json=payload)

# print("状态码:", response.status_code)
# print("响应内容:", response.json())
print("test!")

# MemClaw Web UI

基于 Flask 的 Web 管理界面

## 快速启动

```bash
# 安装依赖
pip install flask

# 启动服务
python app.py

# 访问 http://localhost:5000
```

## 功能

- 📊 记忆统计仪表盘
- 🔍 记忆检索
- 📈 价值评分分析
- 🗑️ 归档管理

## API 端点

| 端点 | 方法 | 说明 |
|-----|------|------|
| /api/stats | GET | 获取记忆统计 |
| /api/memories | GET | 获取记忆列表 |
| /api/search | POST | 搜索记忆 |
| /api/score/<id> | GET | 获取记忆评分 |
| /api/analyze | GET | 分析记忆状态 |

---

*MemClaw v1.0*

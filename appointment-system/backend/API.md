# 在线预约系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:8081`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token，需在请求头中携带 `Authorization: Bearer <token>`

---

## 目录

1. [健康检查](#1-健康检查)
2. [认证模块](#2-认证模块)
3. [服务商模块](#3-服务商模块)
4. [服务模块](#4-服务模块)
5. [预约模块](#5-预约模块)
6. [评论模块](#6-评论模块)
7. [通知模块](#7-通知模块)
8. [统计模块](#8-统计模块)

---

## 1. 健康检查

### GET /api/health

检查服务是否正常运行

**响应示例：**
```json
{
  "status": "ok"
}
```

---

## 2. 认证模块

### POST /api/auth/register

用户注册

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| email | string | 是 | 邮箱 |
| role | string | 否 | 角色，默认 `user`，可选 `provider` |

**请求示例：**
```json
{
  "username": "john_doe",
  "password": "123456",
  "email": "john@example.com",
  "role": "user"
}
```

**成功响应 (200)：**
```json
{
  "message": "注册成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user"
  }
}
```

**失败响应 (400)：**
```json
{
  "error": "用户名已存在"
}
```

---

### POST /api/auth/login

用户登录

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例：**
```json
{
  "username": "john_doe",
  "password": "123456"
}
```

**成功响应 (200)：**
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**失败响应 (401)：**
```json
{
  "error": "用户名或密码错误"
}
```

---

### GET /api/auth/me

获取当前用户信息

**认证要求：** 需要登录

**成功响应 (200)：**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "13800138000",
  "role": "user",
  "avatar": ""
}
```

---

### PUT /api/auth/profile

更新用户资料

**认证要求：** 需要登录

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 用户名 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |
| avatar | string | 否 | 头像URL |

**请求示例：**
```json
{
  "phone": "13900139000",
  "avatar": "https://example.com/avatar.jpg"
}
```

**成功响应 (200)：**
```json
{
  "message": "更新成功"
}
```

---

## 3. 服务商模块

### GET /api/providers

获取服务商列表

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 按分类筛选 |

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "name": "张三的理发店",
    "description": "专业美发服务",
    "address": "北京市朝阳区xxx路xxx号",
    "phone": "010-12345678",
    "category": "美容美发",
    "avatar": "",
    "status": "active"
  }
]
```

---

### GET /api/providers/:id

获取服务商详情

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 服务商ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "user_id": 2,
  "name": "张三的理发店",
  "description": "专业美发服务",
  "address": "北京市朝阳区xxx路xxx号",
  "phone": "010-12345678",
  "category": "美容美发",
  "avatar": "",
  "status": "active",
  "created_at": "2024-01-01 10:00:00"
}
```

**失败响应 (404)：**
```json
{
  "error": "服务商不存在"
}
```

---

### POST /api/providers

创建服务商信息

**认证要求：** provider角色

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 服务商名称 |
| description | string | 否 | 描述 |
| address | string | 否 | 地址 |
| phone | string | 否 | 电话 |
| category | string | 否 | 分类 |
| avatar | string | 否 | 头像URL |

**请求示例：**
```json
{
  "name": "张三的理发店",
  "description": "专业美发服务",
  "address": "北京市朝阳区xxx路xxx号",
  "phone": "010-12345678",
  "category": "美容美发"
}
```

**成功响应 (200)：**
```json
{
  "message": "创建成功",
  "id": 1
}
```

---

### PUT /api/providers/:id

更新服务商信息

**认证要求：** provider角色

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 服务商ID |

**请求体：** 同创建接口

**成功响应 (200)：**
```json
{
  "message": "更新成功"
}
```

---

## 4. 服务模块

### GET /api/services

获取服务列表

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 关键词搜索 |
| category | string | 否 | 按分类筛选 |

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "provider_id": 1,
    "provider_name": "张三的理发店",
    "name": "剪发",
    "description": "专业剪发服务",
    "category": "理发",
    "price": 50.0,
    "duration": 60,
    "image": "",
    "rating": 4.5
  }
]
```

---

### GET /api/services/:id

获取服务详情

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 服务ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "provider_id": 1,
  "provider_name": "张三的理发店",
  "name": "剪发",
  "description": "专业剪发服务",
  "category": "理发",
  "price": 50.0,
  "duration": 60,
  "image": "",
  "status": "active",
  "rating": 4.5,
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "服务很好",
      "username": "john_doe",
      "created_at": "2024-01-01 12:00:00"
    }
  ]
}
```

**失败响应 (404)：**
```json
{
  "error": "服务不存在"
}
```

---

### POST /api/services

创建服务

**认证要求：** provider角色

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 服务名称 |
| description | string | 否 | 描述 |
| category | string | 否 | 分类 |
| price | double | 否 | 价格，默认0.0 |
| duration | int | 否 | 时长(分钟)，默认60 |
| image | string | 否 | 图片URL |

**请求示例：**
```json
{
  "name": "剪发",
  "description": "专业剪发服务",
  "category": "理发",
  "price": 50.0,
  "duration": 60
}
```

**成功响应 (200)：**
```json
{
  "message": "创建成功",
  "id": 1
}
```

**失败响应 (400)：**
```json
{
  "error": "请先创建服务商信息"
}
```

---

### PUT /api/services/:id

更新服务

**认证要求：** provider角色

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 服务ID |

**请求体：** 同创建接口

**成功响应 (200)：**
```json
{
  "message": "更新成功"
}
```

---

### DELETE /api/services/:id

删除服务

**认证要求：** provider角色

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 服务ID |

**成功响应 (200)：**
```json
{
  "message": "删除成功"
}
```

---

## 5. 预约模块

### POST /api/appointments

创建预约

**认证要求：** 需要登录

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| service_id | int | 是 | 服务ID |
| provider_id | int | 是 | 服务商ID |
| appointment_date | string | 是 | 预约日期 (YYYY-MM-DD) |
| appointment_time | string | 是 | 预约时间 (HH:MM) |
| notes | string | 否 | 备注 |

**请求示例：**
```json
{
  "service_id": 1,
  "provider_id": 1,
  "appointment_date": "2024-01-15",
  "appointment_time": "10:00",
  "notes": "希望剪短一些"
}
```

**成功响应 (200)：**
```json
{
  "message": "预约成功",
  "id": 1
}
```

---

### GET /api/appointments/my

获取我的预约列表

**认证要求：** 需要登录

**说明：** 根据用户角色返回不同数据
- `user` 角色：返回用户自己的预约
- `provider` 角色：返回该服务商的预约

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "user_name": "john_doe",
    "service_id": 1,
    "service_name": "剪发",
    "provider_id": 1,
    "provider_name": "张三的理发店",
    "appointment_date": "2024-01-15",
    "appointment_time": "10:00",
    "status": "pending",
    "notes": "希望剪短一些",
    "created_at": "2024-01-10 10:00:00"
  }
]
```

---

### GET /api/appointments/:id

获取预约详情

**认证要求：** 需要登录

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 预约ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "user_id": 1,
  "service_id": 1,
  "service_name": "剪发",
  "service_price": 50.0,
  "provider_id": 1,
  "provider_name": "张三的理发店",
  "appointment_date": "2024-01-15",
  "appointment_time": "10:00",
  "status": "pending",
  "notes": "希望剪短一些",
  "created_at": "2024-01-10 10:00:00"
}
```

---

### PUT /api/appointments/:id/status

更新预约状态

**认证要求：** provider角色

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 预约ID |

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 状态：pending(待确认)、confirmed(已确认)、completed(已完成)、cancelled(已取消) |

**请求示例：**
```json
{
  "status": "confirmed"
}
```

**成功响应 (200)：**
```json
{
  "message": "状态更新成功"
}
```

---

### DELETE /api/appointments/:id

取消预约

**认证要求：** 需要登录

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 预约ID |

**成功响应 (200)：**
```json
{
  "message": "取消成功"
}
```

---

### GET /api/appointments/availability

查询服务商可用时间

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| provider_id | int | 是 | 服务商ID |
| date | string | 是 | 日期 (YYYY-MM-DD) |

**成功响应 (200)：**
```json
[
  {
    "appointment_id": 1,
    "time": "10:00",
    "status": "pending"
  }
]
```

---

## 6. 评论模块

### POST /api/reviews

创建评论

**认证要求：** 需要登录

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| service_id | int | 是 | 服务ID |
| provider_id | int | 是 | 服务商ID |
| appointment_id | int | 否 | 预约ID |
| rating | int | 是 | 评分 (1-5) |
| comment | string | 否 | 评论内容 |

**请求示例：**
```json
{
  "service_id": 1,
  "provider_id": 1,
  "rating": 5,
  "comment": "服务很好，非常满意！"
}
```

**成功响应 (200)：**
```json
{
  "message": "评论成功",
  "id": 1
}
```

---

### GET /api/reviews/service/:service_id

获取服务评论列表

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| service_id | int | 服务ID |

**成功响应 (200)：**
```json
{
  "reviews": [
    {
      "id": 1,
      "user_id": 1,
      "username": "john_doe",
      "rating": 5,
      "comment": "服务很好",
      "created_at": "2024-01-01 12:00:00"
    }
  ],
  "average_rating": 4.5
}
```

---

### GET /api/reviews/provider/:provider_id

获取服务商评论列表

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| provider_id | int | 服务商ID |

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "username": "john_doe",
    "rating": 5,
    "comment": "服务很好",
    "created_at": "2024-01-01 12:00:00"
  }
]
```

---

## 7. 通知模块

### GET /api/notifications

获取通知列表

**认证要求：** 需要登录

**成功响应 (200)：**
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "新预约通知",
      "message": "有新的预约请求",
      "type": "appointment",
      "is_read": false,
      "created_at": "2024-01-01 10:00:00"
    }
  ],
  "unread_count": 1
}
```

---

### PUT /api/notifications/:id/read

标记通知为已读

**认证要求：** 需要登录

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 通知ID |

**成功响应 (200)：**
```json
{
  "message": "已标记为已读"
}
```

---

## 8. 统计模块

### GET /api/stats

获取系统统计数据

**成功响应 (200)：**
```json
{
  "total_users": 100,
  "total_providers": 10,
  "total_services": 50,
  "total_appointments": 200,
  "total_revenue": 10000.0
}
```

---

## 错误响应格式

所有错误响应均遵循以下格式：

```json
{
  "error": "错误描述"
}
```

**常见HTTP状态码：**
| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权/认证失败 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 角色权限说明

| 角色 | 权限说明 |
|------|----------|
| user | 查看服务、创建预约、管理自己的预约和评论 |
| provider | 管理服务商信息、管理服务、处理预约、查看统计 |
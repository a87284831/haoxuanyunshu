# 薪酬核算系统

面向物业服务企业的工资核算平台：钉钉人员档案同步、考勤上传与锁定、多项目工资核算（含试用期/转正分段、月度绩效、季度/半年度兑现、个税补差）、工资条导出、数据全量导出与备份。

## 功能概览

- **钉钉集成**：通讯录/花名册/离职名单同步，支持每天定时同步与事件回调实时同步（可选项）
- **人员档案**：按项目/部门/岗位管理，薪资、职级、试用期、转正日期等字段随钉钉同步
- **考勤管理**：Excel 模板下载、按人上传合并、锁定防篡改、缺卡/迟到阶梯扣款
- **工资核算**：逐日分段计算（试用期/转正/离职当月）、绩效双轨（月度系数 + 季度兑现）、错误码显式失败不静默降级
- **导出**：考勤表、工资表、工资全量数据包、绩效专项表，支持部门合并单元格
- **权限**：总部管理员（全项目）+ 项目账号（仅本项目）

## 环境要求

| 组件 | 版本 |
|---|---|
| PHP | 8.2+（扩展：pdo_mysql、mbstring、zip、gd、fileinfo） |
| Composer | 2.x |
| MySQL | 5.7+ / 8.0 |
| Node.js | 20+（仅构建前端时需要） |
| Web 服务器 | Nginx / Apache |

## 部署步骤

> **没有默认账号密码。** 系统安装后数据库为空，必须执行下方「步骤 2」创建管理员才能登录。

### 1. 后端安装

```bash
composer install --no-dev -o
cp .env.example .env
# 编辑 .env：填写 APP_URL 和数据库连接信息
php artisan key:generate
php artisan migrate
```

### 2. 创建首个管理员账号

```bash
php artisan payroll:init-admin admin 你的密码
```

> **系统没有默认账号密码。** 空白安装后数据库为空，必须先执行此命令创建管理员才能登录。用户名可自定义，密码至少 8 位。

### 3. 前端构建

```bash
cd frontend
npm ci
npm run build
```

构建产物输出到 `public/app/`，由后端站点直接托管，无需单独部署。

### 4. Nginx 配置示例

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    root /var/www/payroll/laravel-app/public;
    index index.php;

    # 前端 SPA（构建产物在 public/app）
    location /app {
        try_files $uri $uri/ /app/index.html;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;   # 按实际环境调整
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 5. 定时任务（可选，钉钉自动同步）

```bash
crontab -e
# 每分钟触发 Laravel 调度器（系统会按配置在每天 02:00 执行钉钉全量同步）
* * * * * cd /var/www/payroll/laravel-app && php artisan schedule:run >> /dev/null 2>&1
```

## 钉钉配置

登录系统后进入「设置」页填写（保存到系统数据库，均为空表示未启用同步）：

| 配置项 | 说明 |
|---|---|
| AppKey / AppSecret | 钉钉开放平台应用凭证 |
| AgentId | 应用 AgentId |
| 回调 Token / 加密密钥 | 仅在配置事件回调时需要 |

填写后点「立即同步」验证连通性。事件回调（实时同步人员增删改）为可选项，需在钉钉开放平台「事件订阅」中登记回调地址，未配置时依靠定时同步兜底。

## 数据初始化

空白安装后建议按以下顺序配置：

1. **项目设置** → 创建薪酬项目
2. **钉钉同步** → 拉取人员档案（或在人员页手工添加）
3. **符号库/规则** → 核算规则与考勤符号（默认模板已内置，可调整）
4. **考勤上传** → 下载模板填写后上传并锁定
5. **工资核算** → 按月核算并导出

## 目录结构

```
laravel-app/
├── app/
│   ├── Console/Commands/     # 钉钉同步、管理员初始化、重算命令
│   ├── Http/Controllers/Api/ # 全部业务接口
│   └── Services/             # 核算引擎、钉钉服务、状态判定
├── database/migrations/      # 数据库结构
├── frontend/                 # Vue3 前端源码（构建输出到 public/app）
├── public/app/               # 前端构建产物
└── routes/                   # 路由与调度定义
```

## 备份建议

至少每日备份数据库（mysqldump）与 `.env`。系统数据全部在 MySQL 中，文件上传存于 `storage/app/private/`。

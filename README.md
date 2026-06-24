# OWeek 个人主页系统 · v1.0

新生在线编辑个人主页，OWeek 期间通过 NFC 碰一碰或二维码扫码查看：墙上明信片→位置页，展位展板→主页。

## 一句话

把线下碰一碰变成一场认识人的旅途——先碰明信片找到对方的展位在哪，走过去当面聊，再碰展板看主页。全程没有账号、没有密码，链接就是身份。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16 (App Router) + React + TypeScript |
| 数据库 | PostgreSQL (Neon Serverless)，Prisma ORM |
| 图片存储 | Cloudflare R2（S3 兼容，presigned URL 直传） |
| 图片压缩 | browser-image-compression（浏览器端） |
| 短码/Token | nanoid |
| 二维码 | qrcode |
| 样式 | Tailwind CSS，手机端优先 |
| 部署 | Vercel + Cloudflare DNS |

## 快速开始

### 前置条件

- Node.js 18+
- Neon PostgreSQL 数据库
- Cloudflare R2 存储桶

### 环境变量

复制 `.env.example`（或手动创建 `.env`）：

```bash
DATABASE_URL=           # Neon pooled 连接串（查询用）
DIRECT_URL=             # Neon direct 连接串（仅 prisma migrate）
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=     # R2 公开访问域名
ADMIN_PASSWORD=         # 运营后台口令
APP_BASE_URL=           # 如 https://xxx.top，导出链接拼前缀用
```

### 安装与运行

```bash
npm install
npx prisma migrate dev    # 建表
npm run dev               # 启动开发服务器 → http://localhost:3000
```

### 部署

1. GitHub 建仓，推代码
2. Neon 建库 → 拿到两个连接串
3. Cloudflare R2 建桶 → 开公开访问 + 配 CORS → 拿到 S3 密钥
4. Vercel 连仓 → 填环境变量 → 部署
5. 域名 DNS 走 Cloudflare 指向 Vercel → HTTPS 自动
6. 真机在校园网实测 `/u/{code}` 和 `/loc/{code}` 打开速度

## 系统架构

```
┌──────────────┐     ┌──────────────┐
│  墙上明信片    │     │  展位展板     │
│  /loc/{code}  │     │  /u/{code}   │
│  位置页       │     │  个人主页     │
└──────┬───────┘     └──────┬───────┘
       │                    │
       └────────┬───────────┘
                │
       ┌────────┴────────┐
       │    Vercel        │
       │  Next.js App     │
       │  ┌─────────────┐ │
       │  │ /api/*      │ │
       │  │ /u/[code]   │ │
       │  │ /loc/[code]  │ │
       │  │ /edit/[token]│ │
       │  │ /admin       │ │
       │  └─────────────┘ │
       └───┬───────┬──────┘
           │       │
    ┌──────┘       └──────┐
    ▼                     ▼
┌────────┐          ┌──────────┐
│  Neon   │          │  R2 (S3) │
│PostgreSQL│         │  图片存储 │
└────────┘          └──────────┘
```

## 项目结构

```
app/
  u/[code]/
    page.tsx                 # 公开主页（SSR）
    ImageLightbox.tsx         # 全屏灯箱（客户端）
    ImageGallery.tsx          # 图片网格 + 灯箱触发（客户端）
  loc/[code]/
    page.tsx                 # 位置页（SSR）
    FavoriteButton.tsx        # 收藏按钮（客户端，localStorage）
  edit/[token]/page.tsx      # 编辑页（客户端，含头像+图片上传）
  me/collection/page.tsx     # 本地收藏列表（客户端，localStorage）
  admin/page.tsx             # 运营后台（口令登录）
  api/
    me/route.ts              # GET / PATCH 自己数据
    me/images/route.ts       # POST 保存 / DELETE 删除图片记录
    upload-url/route.ts      # POST 获取 R2 presigned PUT URL
    admin/login/route.ts     # POST 口令登录
    admin/import/route.ts    # POST 批量导入名单
    admin/location/route.ts  # POST 编辑位置页
    admin/takedown/route.ts  # POST 下架开关
    admin/export/route.ts    # GET 导出 CSV 链接表
    admin/persons/route.ts   # GET 所有人列表（下架面板用）
components/
  AvatarUploader.tsx          # 头像上传（压缩 + presigned 直传）
  ImageGrid.tsx               # 多图上传网格（最多 4 张，含删除）
lib/
  prisma.ts                  # Prisma client 单例
  r2.ts                      # R2 S3 client + presigned URL（懒加载）
  auth.ts                    # editToken 校验 / admin JWT session
  code.ts                    # nanoid 短码 + 编辑 token 生成
  qr.ts                      # 二维码生成（SVG / DataURL）
prisma/
  schema.prisma              # 数据模型（Person / Image / LocationCard）
  migrations/                # 数据库迁移文件
```

## 核心设计决策

- **无账号体系**：编辑凭 token URL，浏览者无身份，收藏存 localStorage
- **图片直传 R2**：前端压缩后通过 presigned URL 直传，不经过服务端
- **短码复用**：同一 `code` 同时服务于 `/u/{code}`（主页）和 `/loc/{code}`（位置页）
- **位置页是兜底**：即使某人没布置主页，位置页依然在，保证平等曝光
- **头像必填才可发布**：`published=true` 时必须有 `avatarUrl`
- **bio 按 code point 计数**：上限 80，不是 byte 也不是 char

## 验证 Check

| 检查项 | 命令/方法 |
|---|---|
| 数据库连通 | `npx prisma db push --dry-run` |
| 类型检查 | `npx tsc --noEmit` |
| 构建 | `npm run build` |
| 生产启动 | `npm start` |

## v1.0 范围

**做**：个人主页编辑、位置页展示、浏览器本地收藏、运营后台

**不做**：服务端账号、登录/注册、评论、点赞、社交链接、配对算法、消息通知

## 文档

- [PRD – 产品需求文档](docs/01_PRD_OWeek个人主页系统_v1.0.md)
- [开发文档 – 接口契约与构建顺序](docs/02_开发文档_OWeek个人主页系统_v1.0.md)
- [AGENTS.md](AGENTS.md) – coding agent 工作规范

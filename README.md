# Sage · Signpost — 个人网站

纯前端单页 3D 个人网站：纯白背景中的路标装置，用 Three.js 构建。
水平拖动可环绕查看，点击任意路牌会平滑聚焦到该牌正面，点击空白处（或按 Esc）回到之前的视角。

**线上地址：** https://sagee1125.github.io

## 本地运行

直接双击 `index.html` 即可（Three.js 通过 CDN 加载，首次打开需要联网）。

也可以用本地服务器：

```bash
npx serve .
```

## 如何替换路牌图片

打开 `index.html`，找到顶部的 `SIGN_DEFS` 配置数组。每块路牌一项，把 `image` 从 `null` 改为图片地址即可（支持相对路径或完整 URL）：

```js
{ shape: 'hrect', y: 1.55, angle: 12, arm: 1.05, w: 2.7, h: 1.45,
  label: 'ABOUT', colorA: '#a8c8e8', colorB: '#e3eefb',
  image: 'images/about.jpg' },   // ← 填你的图片
```

建议图片比例接近该牌的宽高比（`w : h`），例如横矩形 2.7 : 1.45、圆形 1 : 1、正三角形 1 : 0.866。图片会自动铺满整个牌面。

## 如何调整布局

`SIGN_DEFS` 中每个字段都可以改：

| 字段 | 含义 |
| --- | --- |
| `shape` | `hrect` 横矩形 / `vrect` 竖矩形 / `square` 正方形 / `circle` 圆形 / `triangle` 圆角三角形 |
| `y` | 路牌在杆上的高度 |
| `angle` | 围绕路杆的角度（度） |
| `arm` | 支撑横杆长度 |
| `w` / `h` | 牌面尺寸（圆为直径，三角形为边长） |
| `label` / `colorA` / `colorB` | 占位图上的文字与配色（替换真图后不再显示） |

新增/删除数组元素即可增减路牌，其余自动生成（边框、横杆、箍环等）。

## 发布说明

- 仓库：`sagee1125.github.io`（GitHub Pages 个人主页仓库）
- 部署：推送到 `main` 分支即自动生效（Pages 从 main 根目录发布）
- 更新网站：改完文件后 `git add . && git commit -m "update" && git push`

## 技术要点

- Three.js r170（CDN importmap），单文件无构建
- 贴图放在独立 `ShapeGeometry` 上并重算 UV，规避 `ExtrudeGeometry` 默认 UV 导致的黑图问题
- `OrbitControls` 锁定极角（只允许水平环绕）；聚焦/恢复为自写补间动画（easeInOutCubic）
- 背景为透明画布 + CSS 纯白，保证页面纯白不受色调映射影响

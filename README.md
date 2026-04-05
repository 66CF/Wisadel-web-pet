# Wishdel Web Pet

一个可召唤、可拖拽、可追鼠标的维什戴尔网页桌宠。

## 功能

- 点击按钮召唤 / 收起桌宠
- 单击互动，双击触发特殊动作
- 空闲时会在页面内随机巡逻
- 可切换“追鼠模式”，并会实时朝向鼠标方向翻面
- 支持拖拽换位置
- 记住显示状态和上次驻留位置

## 目录结构

```text
wishdel-web-pet/
  assets/               桌宠动作素材
  demo/                 开箱即用演示页
  dist/                 编译后的浏览器脚本
  snippets/             可直接复制到网页里的控制按钮片段
  src/                  TypeScript 源码
  package.json
  tsconfig.json
  README.md
```

## 本地预览

先在这个目录运行一次构建：

```bash
npm install
npm run build
```

然后用任意静态服务器打开仓库目录，例如：

```bash
python -m http.server 4173
```

接着访问：

```text
http://localhost:4173/demo/
```

### 方式一：通过 GitHub 导入

1. 把当前仓库推到 GitHub
2. 打开 Vercel 并选择 `Add New Project`
3. 导入这个 GitHub 仓库
4. Framework Preset 选择 `Other`
5. 保持以下设置：

```text
Build Command: npm run build
Output Directory: .
Install Command: npm install
```

6. 点击部署

部署完成后：

- `https://你的项目域名.vercel.app/` 会直接进入 demo 首页
- `https://你的项目域名.vercel.app/demo/` 也可以直接访问演示页

### 部署时需要注意

- `dist/` 需要由 `npm run build` 生成，Vercel 会自动执行这个构建命令
- `assets/`、`snippets/`、`demo/` 都要保留在仓库根目录
- 如果以后你把演示页从 `demo/index.html` 改到别的位置，记得同步更新 `vercel.json`

## 集成到任意网页

1. 复制 `assets/`、`dist/wishdelPet.js`、`snippets/pet-controls.css`
2. 在页面里加入按钮 HTML
3. 在加载脚本前设置素材路径
4. 以 `type="module"` 方式引入脚本

示例：

```html
<link rel="stylesheet" href="./snippets/pet-controls.css" />

<div class="wishdel-pet-controls">
  <button
    id="wishdel-pet-toggle"
    type="button"
    class="wishdel-pet-button"
    aria-controls="wishdel-web-pet-root"
    aria-pressed="false"
  >
    <span aria-hidden="true" class="wishdel-pet-dot"></span>
    <span data-pet-label>召唤桌宠</span>
  </button>

  <button
    id="wishdel-pet-mode"
    type="button"
    class="wishdel-pet-button wishdel-pet-button-secondary"
    aria-pressed="false"
  >
    <span data-pet-mode-label>追鼠模式</span>
  </button>
</div>

<script>
  window.__wishdelPetAssetBase = "./assets/";
</script>
<script type="module" src="./dist/wishdelPet.js"></script>
```

如果你愿意直接改源码，也可以使用 `src/wishdelPet.ts` 自行编译。

## 说明

- 脚本默认会从 `dist/wishdelPet.js` 的相对位置寻找 `../assets/`
- 如果你的素材目录不在默认位置，可以通过 `window.__wishdelPetAssetBase` 覆盖
- 这是从现有博客桌宠实现中抽离出来的独立版本

## 素材提醒

素材来源：<https://prts.wiki/w/%E7%BB%B4%E4%BB%80%E6%88%B4%E5%B0%94>
# Wishdel Web Pet

一个可召唤、可拖拽、可追鼠标的维什戴尔网页桌宠。

这个目录已经按独立 GitHub 仓库整理好了，你可以直接把整个 `wishdel-web-pet` 文件夹移动到别处再上传。

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

## 发布到 GitHub

在这个文件夹里执行：

```bash
git init
git add .
git commit -m "feat: initial wishdel web pet"
git branch -M main
git remote add origin https://github.com/你的用户名/wishdel-web-pet.git
git push -u origin main
```

## 说明

- 脚本默认会从 `dist/wishdelPet.js` 的相对位置寻找 `../assets/`
- 如果你的素材目录不在默认位置，可以通过 `window.__wishdelPetAssetBase` 覆盖
- 这是从现有博客桌宠实现中抽离出来的独立版本

## 素材提醒

代码仓库可以公开，但动作素材是否适合公开再分发，建议你自行确认对应版权和授权范围。

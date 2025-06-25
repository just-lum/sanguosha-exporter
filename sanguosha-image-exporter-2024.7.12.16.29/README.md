# 三国杀武将图片导出工具 - 部署指南

本指南将引导您将此工具部署到互联网上，以便您可以通过一个简单的链接在任何地方使用它，而无需在本地计算机上运行任何命令。

我们将使用 **GitHub Pages**，这是一项由 GitHub 提供的免费静态网站托管服务。

## 部署步骤

### 第一步：创建 GitHub 仓库

1.  登录您的 [GitHub](https://github.com) 帐户。
2.  点击页面右上角的 **+** 号，然后选择 **New repository**。
3.  为您的仓库命名，例如 `sanguosha-exporter`。
4.  确保仓库设置为 **Public**。
5.  点击 **Create repository**。

### 第二步：上传项目文件

1.  在您刚刚创建的仓库页面上，点击 **Add file**，然后选择 **Upload files**。
2.  将以下三个文件从您的电脑（位于 `sanguosha-image-exporter-2024.7.12.16.29` 文件夹中）拖拽到上传区域：
    *   `index.html`
    *   `style.css`
    *   `script.js`
3.  在下方的提交信息（Commit changes）中，可以简单填写 "Initial commit"。
4.  点击 **Commit changes** 按钮。

### 第三步：启用 GitHub Pages

1.  在您的仓库页面上，点击顶部的 **Settings** 标签。
2.  在左侧导航栏中，点击 **Pages**。
3.  在 "Build and deployment" 下的 "Source" 部分，选择 **Deploy from a branch**。
4.  在 "Branch" 部分，确保分支选择为 `master` (或 `main`)，文件夹选择 `/(root)`。
5.  点击 **Save**。

### 第四步：访问您的网站

1.  GitHub Pages 需要一两分钟来构建和发布您的网站。
2.  刷新 **Settings > Pages** 页面，您应该会在页面顶部看到一个绿色的提示框，内容为："Your site is live at `https://<您的GitHub用户名>.github.io/<您的仓库名>/`"。
3.  **恭喜您！** 您现在可以通过这个链接随时随地使用您的三国杀武将图片导出工具了。 
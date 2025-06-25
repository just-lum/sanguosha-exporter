document.addEventListener('DOMContentLoaded', () => {
    const heroNameInput = document.getElementById('heroName');
    const searchButton = document.getElementById('searchButton');
    const downloadButton = document.getElementById('downloadButton');
    const statusDiv = document.getElementById('status');
    const previewContainer = document.getElementById('previewContainer');
    const localImageInput = document.getElementById('localImageInput');
    const addLocalImagesButton = document.getElementById('addLocalImagesButton');
    
    let imageFileDatabase = []; // 用于存储从GitHub API获取的全量文件列表

    // 1. 核心改进：页面加载时即初始化图片数据库
    async function initializeDatabase() {
        statusDiv.innerHTML = '首次加载，正在初始化图库数据，请稍候... (约5-10秒)';
        searchButton.disabled = true;

        const repoOwner = 'KelvinQQ';
        const repoName = 'SgsSkin';
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/master?recursive=1`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`GitHub API 请求失败: ${response.status}`);
            }
            const data = await response.json();

            // 过滤出图片文件，并存储其路径
            imageFileDatabase = data.tree
                .map(file => file.path)
                .filter(path => /\.(jpg|jpeg|png)$/i.test(path));
            
            if (imageFileDatabase.length > 0) {
                statusDiv.innerHTML = `图库初始化完成，共索引 ${imageFileDatabase.length} 张图片。请输入武将名开始搜索。`;
            } else {
                 throw new Error('未能从GitHub加载任何图片数据。');
            }

        } catch (error) {
            console.error('初始化图库失败:', error);
            statusDiv.innerHTML = `图库初始化失败: ${error.message} <br>请检查网络连接，或刷新页面重试。您也可以使用下方的本地上传功能。`;
            // 即使失败，也允许本地上传
        } finally {
            searchButton.disabled = false;
        }
    }

    // 2. 重写搜索函数：在本地数据库中进行快速查找
    function searchImages(heroName) {
        statusDiv.innerHTML = '';
        previewContainer.innerHTML = '';
        downloadButton.classList.add('hidden');
        
        if (imageFileDatabase.length === 0) {
            statusDiv.innerHTML = '图库尚未初始化，请等待初始化完成后再试。';
            return;
        }

        searchButton.disabled = true;
        statusDiv.innerHTML = `正在 " ${heroName} " 的相关图片...`;

        // 在本地缓存的列表中进行过滤
        const searchResults = imageFileDatabase.filter(path => {
            // 从路径中提取文件名 (e.g., "SP关羽.jpg")
            const fileName = path.split('/').pop();
            // 移除扩展名进行匹配 (e.g., "SP关羽")
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
            return nameWithoutExt.includes(heroName);
        });
        
        if (searchResults.length > 0) {
            statusDiv.innerHTML = `为" ${heroName} "找到 ${searchResults.length} 张图片。`;
            displayImages(searchResults);
            downloadButton.classList.remove('hidden');
        } else {
            statusDiv.innerHTML = `在图库中未找到" ${heroName} "的相关图片。请尝试其他武将名。`;
        }

        searchButton.disabled = false;
    }

    // 3. 重写展示函数：根据路径获取并展示图片
    async function displayImages(imagePaths) {
        const repoOwner = 'KelvinQQ';
        const repoName = 'SgsSkin';
        const cdnUrlBase = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@master/`;

        // 清空现有预览
        previewContainer.innerHTML = '';
        foundImagesData = []; // 清空已存储的图片数据

        const imagePromises = imagePaths.map(async (path, index) => {
            const fullUrl = cdnUrlBase + encodeURI(path);
            const fileName = path.split('/').pop();
            const packageName = path.substring(0, path.lastIndexOf('/'));
            
            // 创建预览项
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('preview-item');
            
            const img = document.createElement('img');
            img.src = fullUrl; // 直接使用CDN链接
            img.alt = fileName;
            img.loading = 'lazy'; // 启用懒加载
            img.onerror = () => {
                img.alt = '图片加载失败';
                // 可选：显示一个占位图
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            };
            
            const checkIcon = document.createElement('div');
            checkIcon.classList.add('check-icon');
            checkIcon.textContent = '✔';
            
            const label = document.createElement('div');
            label.classList.add('image-label');
            label.textContent = packageName;

            itemDiv.appendChild(img);
            itemDiv.appendChild(checkIcon);
            itemDiv.appendChild(label);
            previewContainer.appendChild(itemDiv);
            
            itemDiv.addEventListener('click', () => {
                itemDiv.classList.toggle('selected');
            });

            // 为了下载功能，我们需要在用户选择时才去获取blob
            return {
                element: itemDiv,
                path: path,
                name: `${packageName}_${fileName}`
            };
        });
        
        await Promise.all(imagePromises);
    }
    
    // 4. 修改下载函数：按需获取Blob
    async function downloadSelectedImages() {
        const selectedItems = previewContainer.querySelectorAll('.preview-item.selected');
        if (selectedItems.length === 0) {
            statusDiv.innerHTML = '请至少选择一张图片进行下载。';
            return;
        }

        statusDiv.innerHTML = `正在准备下载 ${selectedItems.length} 张图片...`;
        downloadButton.disabled = true;

        try {
            if (typeof JSZip === 'undefined') throw new Error('JSZip库未加载');
            
            const zip = new JSZip();
            
            const fetchPromises = Array.from(selectedItems).map(async item => {
                const imgElement = item.querySelector('img');
                const imageUrl = imgElement.src;
                const path = decodeURI(imageUrl.substring(imageUrl.indexOf('@master/') + 8));
                const fileName = path.split('/').pop();
                const packageName = path.substring(0, path.lastIndexOf('/'));

                try {
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error(`无法下载 ${fileName}`);
                    const blob = await response.blob();
                    zip.file(`${packageName}_${fileName}`, blob);
                } catch (e) {
                    console.error(`下载文件失败: ${imageUrl}`, e);
                    // 可以在此处通知用户某个文件下载失败
                }
            });
            
            await Promise.all(fetchPromises);

            statusDiv.innerHTML = `正在压缩 ${selectedItems.length} 张图片...`;
            const content = await zip.generateAsync({ type: 'blob' });
            const heroName = heroNameInput.value.trim() || 'sanguosha';
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${heroName}_皮肤包.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            statusDiv.innerHTML = `成功导出 ${selectedItems.length} 张图片！`;
        } catch (error) {
            console.error('打包或下载时出错:', error);
            statusDiv.innerHTML = `导出失败: ${error.message}`;
        } finally {
            downloadButton.disabled = false;
        }
    }

    // 搜索按钮事件
    searchButton.addEventListener('click', () => {
        const heroName = heroNameInput.value.trim();
        if (!heroName) {
            statusDiv.textContent = '请输入武将名称。';
            return;
        }
        searchImages(heroName);
    });

    // Enter键事件
    heroNameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchButton.click();
        }
    });

    // 本地上传相关功能保持不变
    addLocalImagesButton.addEventListener('click', () => {
        const files = localImageInput.files;
        if (files.length > 0) processLocalImages(files);
    });

    async function processLocalImages(files) {
        statusDiv.innerHTML = `正在处理 ${files.length} 张本地图片...`;
        const localImages = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            localImages.push({
                name: file.name,
                blob: file,
                packageName: '本地上传',
                searchName: file.name.replace(/\.[^/.]+$/, "")
            });
        }

        // 将本地图片添加到预览中
        const currentItems = Array.from(previewContainer.children);
        previewContainer.innerHTML = ''; // 清空

        const allImageData = foundImagesData.concat(localImages);
        foundImagesData = allImageData; // 更新全局数据

        displayLocalAndRemoteImages(allImageData);

        statusDiv.innerHTML += ` 已添加 ${localImages.length} 张本地图片。`;
        if(allImageData.length > 0) downloadButton.classList.remove('hidden');
    }
    
    function displayLocalAndRemoteImages(images) {
        previewContainer.innerHTML = '';
        images.forEach((imageData, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('preview-item');
            
            const img = document.createElement('img');
            // 如果是blob，则创建URL，否则直接用URL
            img.src = imageData.blob ? URL.createObjectURL(imageData.blob) : imageData.url;
            img.alt = imageData.searchName;
            
            const checkIcon = document.createElement('div');
            checkIcon.classList.add('check-icon');
            checkIcon.textContent = '✔';
            
            const label = document.createElement('div');
            label.classList.add('image-label');
            label.textContent = imageData.packageName;

            itemDiv.appendChild(img);
            itemDiv.appendChild(checkIcon);
            itemDiv.appendChild(label);
            previewContainer.appendChild(itemDiv);

            itemDiv.addEventListener('click', () => {
                itemDiv.classList.toggle('selected');
            });
        });
    }

    // 页面加载后立即开始初始化
    initializeDatabase();
}); 
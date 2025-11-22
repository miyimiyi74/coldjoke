// 全局变量：互动数据存储键名（本地存储用）
const JOKE_INTERACTION_KEY = 'jokeUserInteractions';

// 1. 问答笑话：点击展开/隐藏答案
function toggleJokeAnswer(answerId) {
    const answerEl = document.getElementById(answerId);
    const btnEl = document.querySelector(`[onclick="toggleJokeAnswer('${answerId}')"]`);
    
    // 切换答案显示/隐藏
    const isShow = answerEl.style.display !== 'block';
    answerEl.style.display = isShow ? 'block' : 'none';
    // 切换按钮文字
    btnEl.textContent = isShow ? '收起答案' : '查看答案';
}

// 2. 互动功能：点赞/收藏/不喜欢（登录验证+状态存储）
// 检查是否登录
function checkIsLogin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('请先登录再进行互动哦～');
        return false;
    }
    return currentUser.username;
}

// 获取用户的互动记录
function getUserInteractions(username) {
    const allData = JSON.parse(localStorage.getItem(JOKE_INTERACTION_KEY) || '{}');
    // 按用户名隔离数据（多用户不冲突）
    return allData[username] || {};
}

// 保存用户的互动记录
function saveUserInteraction(jokeId, type) {
    const username = checkIsLogin();
    if (!username) return;

    const allData = JSON.parse(localStorage.getItem(JOKE_INTERACTION_KEY) || '{}');
    // 初始化当前用户的互动数据
    if (!allData[username]) allData[username] = {};
    const userData = allData[username];
    // 初始化当前笑话的互动状态
    if (!userData[jokeId]) userData[jokeId] = { like: false, collect: false, dislike: false };

    // 切换状态（点赞/不喜欢互斥，收藏独立）
    if (type === 'like' || type === 'dislike') {
        userData[jokeId][type] = !userData[jokeId][type];
        // 互斥逻辑：点赞和不喜欢不能同时选中
        if (type === 'like') userData[jokeId].dislike = false;
        if (type === 'dislike') userData[jokeId].like = false;
    } else if (type === 'collect') {
        userData[jokeId][type] = !userData[jokeId][type];
    }

    // 保存到本地存储
    localStorage.setItem(JOKE_INTERACTION_KEY, JSON.stringify(allData));
    // 更新按钮样式
    updateInteractionBtnStyle(jokeId, type, userData[jokeId][type]);
        const messages = {
        like: userData[jokeId][type] ? "点赞成功！" : "取消点赞",
        collect: userData[jokeId][type] ? "收藏成功！" : "取消收藏",
        dislike: userData[jokeId][type] ? "已标记不喜欢" : "取消不喜欢"
    };
    alert(messages[type]); // 简单提示，可替换为Toast组件
}

// 更新互动按钮样式（高亮已选中状态）
function updateInteractionBtnStyle(jokeId, type, isActive) {
    const btn = document.querySelector(`[data-joke-id="${jokeId}"][data-type="${type}"]`);
    if (!btn) return;

    // 移除所有按钮的高亮（针对点赞/不喜欢互斥）
    if (type === 'like' || type === 'dislike') {
        document.querySelectorAll(`[data-joke-id="${jokeId}"]`).forEach(el => {
            el.classList.remove('active');
        });
    }

    // 给当前按钮添加/移除高亮
    if (isActive) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

// 页面加载时，渲染已有的互动状态（恢复之前的点赞/收藏）
function renderInteractionStatus() {
    const username = checkIsLogin();
    if (!username) return;

    const userInteractions = getUserInteractions(username);
    // 遍历所有互动按钮，恢复状态
    document.querySelectorAll('[data-joke-id]').forEach(btn => {
        const jokeId = btn.dataset.jokeId;
        const type = btn.dataset.type;
        const jokeStatus = userInteractions[jokeId] || {};
        
        if (jokeStatus[type]) {
            btn.classList.add('active');
        }
    });
}

// 3. 用户中心专用：获取分类互动记录（供userCenter.html调用）
function getUserInteractionList(type) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return [];

    const userInteractions = getUserInteractions(currentUser.username);
    const result = [];
    // 遍历所有互动记录，筛选对应类型（点赞/收藏/不喜欢）
    for (const jokeId in userInteractions) {
        if (userInteractions[jokeId][type]) {
            result.push(jokeId);
        }
    }
    return result;
}

// 页面加载时执行（仅笑话页需要渲染互动状态）
if (document.querySelector('[data-joke-id]')) {
    window.addEventListener('load', renderInteractionStatus);
}
// 新增：监听localStorage变化，同步状态
window.addEventListener('storage', function(e) {
    // 登录状态变化时更新导航栏和互动状态
    if (e.key === 'currentUser') {
        updateNavbar(); // 假设此函数在index.html中定义，用于更新导航栏
        renderInteractionStatus(); // 重新渲染互动按钮状态
    }
    // 互动数据变化时更新按钮样式
    if (e.key === JOKE_INTERACTION_KEY) {
        renderInteractionStatus();
    }
});
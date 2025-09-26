require('dotenv').config();
const express = require('express');
const axios = require('axios'); // 致命错误修复：添加了这一行
const cors = require('cors');

const app = express();
const port = 3001;

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('错误：GOOGLE_API_KEY 环境变量未设置！');
    process.exit(1);
}

// 增加了请求体大小限制，以支持图片上传
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// 致命错误修复：使用一个统一的代理入口
app.post('/api/proxy', async (req, res) => {
    const { targetUrl, payload } = req.body;

    if (!targetUrl || !payload) {
        return res.status(400).json({ error: '缺少 targetUrl 或 payload' });
    }

    console.log(`--- 正在代理请求至: ${targetUrl} ---`);

    try {
        const fullUrl = `${targetUrl}?key=${apiKey}`;
        const response = await axios.post(fullUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('--- 成功将Google API响应转发给前端 ---\n');
        res.status(response.status).json(response.data);

    } catch (error) {
        // 优化了错误日志，能更清晰地看到 Google 返回的错误
        console.error('代理请求时发生错误:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({
            error: '后台代理请求失败',
            details: error.response?.data || { message: error.message }
        });
    }
});

app.listen(port, () => {
    console.log(`后台服务已启动，正在监听 ${port} 端口...`);
});

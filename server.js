require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// 模拟存储验证码的地方 (生产环境应使用数据库如Redis)
const verificationCodes = new Map();

// --- 手机验证 API ---
app.post('/api/send-code', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ message: '手机号不能为空' });
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 生成4位随机码
    verificationCodes.set(phone, code);
    
    console.log(`--- 收到发送验证码请求 ---`);
    console.log(`手机号: ${phone}`);
    console.log(`生成的验证码是: ${code} (模拟发送，实际应通过短信服务商)`);
    console.log('---------------------------\n');
    
    // 此处应集成短信服务商API来发送 `code`
    
    res.status(200).json({ message: '验证码已发送 (请在后台查看)' });
});

app.post('/api/verify-code', (req, res) => {
    const { phone, code } = req.body;
    const storedCode = verificationCodes.get(phone);

    console.log(`--- 收到验证验证码请求 ---`);
    console.log(`手机号: ${phone}, 尝试的验证码: ${code}`);
    console.log(`服务器存储的验证码是: ${storedCode}`);

    if (storedCode && storedCode === code) {
        verificationCodes.delete(phone); // 验证成功后删除
        console.log(`验证成功!`);
        console.log('---------------------------\n');
        res.status(200).json({ success: true, message: '验证成功' });
    } else {
        console.log(`验证失败!`);
        console.log('---------------------------\n');
        res.status(400).json({ success: false, message: '验证码错误' });
    }
});


// --- Google API 代理 ---
app.post('/api/generate-image', async (req, res) => {
    const userPayload = req.body;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GOOGLE_API_KEY}`;

    console.log('--- 收到图片生成请求 (通过后台代理) ---');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });
        const data = await response.json();
        if(!response.ok) {
           console.error('Google API 错误:', data);
           throw new Error(data.error.message || 'Google API request failed');
        }
        console.log('成功将Google API响应转发给前端。\n');
        res.status(200).json(data);
    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({ message: '后台代理请求失败', error: error.message });
    }
});

app.post('/api/generate-content', async (req, res) => {
    const userPayload = req.body;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GOOGLE_API_KEY}`;
     console.log('--- 收到内容生成请求 (通过后台代理) ---');
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });
        const data = await response.json();
        if(!response.ok) {
           console.error('Google API 错误:', data);
           throw new Error(data.error.message || 'Google API request failed');
        }
        console.log('成功将Google API响应转发给前端。\n');
        res.status(200).json(data);
    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({ message: '后台代理请求失败', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`后台服务已启动，正在监听 ${PORT} 端口...`);
});

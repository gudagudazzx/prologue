// api/minimax.js
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 从环境变量获取 API Key
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
  if (!MINIMAX_API_KEY) {
    console.error('MINIMAX_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error: missing API key' });
  }

  // 获取请求体
  const requestBody = req.body;
  if (!requestBody || !requestBody.text) {
    return res.status(400).json({ error: 'Missing text in request body' });
  }

  try {
    const response = await fetch('https://api.minimax.io/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 检查 MiniMax 返回的状态
    if (data?.base_resp?.status_code !== 0) {
      console.error('MiniMax API error:', data?.base_resp?.status_msg);
      return res.status(400).json({ error: data?.base_resp?.status_msg || 'MiniMax error' });
    }

    // 返回音频数据
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

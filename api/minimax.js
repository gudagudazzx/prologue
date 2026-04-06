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

  // 获取前端发来的扁平请求体
  const flatBody = req.body;
  if (!flatBody || !flatBody.text) {
    return res.status(400).json({ error: 'Missing text in request body' });
  }

  // 转换为 MiniMax API v2 要求的嵌套格式
  const requestBody = {
    model: flatBody.model || 'speech-02-turbo',
    text: flatBody.text,
    voice_setting: {
      voice_id: flatBody.voice_id,
      speed: flatBody.speed !== undefined ? flatBody.speed : 1.0,
      vol: flatBody.vol !== undefined ? flatBody.vol : 1.0,
      pitch: flatBody.pitch !== undefined ? flatBody.pitch : 0,
      emotion: flatBody.emotion || 'neutral'
    },
    audio_setting: {
      sample_rate: flatBody.audio_sample_rate || 32000,
      bitrate: flatBody.bitrate || 128000,
      format: flatBody.format || 'mp3'
    }
  };

  // 打印发送到 MiniMax 的请求体（调试用，可在 Vercel 日志中查看）
  console.log('[MiniMax Proxy] Request body:', JSON.stringify(requestBody, null, 2));

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
    if (!response.ok || data?.base_resp?.status_code !== 0) {
      console.error('MiniMax error:', data);
      return res.status(400).json({
        error: 'MiniMax API error',
        details: data?.base_resp?.status_msg || data,
      });
    }

    // 返回音频数据
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

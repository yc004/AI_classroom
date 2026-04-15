import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { ArkRuntimeClient } from '@volcengine/ark-runtime';

const router = express.Router();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 历史记录存储路径
const historyFilePath = path.join(__dirname, '../../data/history.json');
// 配置文件路径
const configFilePath = path.join(__dirname, '../../data/config.json');

// 确保数据目录存在
const ensureDataDir = () => {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(historyFilePath)) {
    fs.writeFileSync(historyFilePath, JSON.stringify([]));
  }
  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify({
      textModel: {
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        modelName: 'deepseek-chat',
        apiKey: ''
      },
      imageModel: {
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        modelName: 'deepseek-vision',
        apiKey: ''
      },
      videoModel: {
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        modelName: 'deepseek-video',
        apiKey: ''
      },
      systemSettings: {
        port: 3001,
        allowLanAccess: true,
        rateLimit: 100
      }
    }));
  }
};

// 获取配置
const getConfig = (): any => {
  ensureDataDir();
  const data = fs.readFileSync(configFilePath, 'utf8');
  return JSON.parse(data);
};

// 保存历史记录
const saveHistory = (item: any) => {
  ensureDataDir();
  const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
  history.push(item);
  // 限制历史记录数量
  if (history.length > 1000) {
    history.splice(0, history.length - 1000);
  }
  fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
};

// 文本生成
const generateText = async (prompt: string, model: string, parameters: any): Promise<string> => {
  const config = getConfig();
  const textModelConfig = config.textModel;
  
  try {
    if (textModelConfig.provider === 'volcengine') {
      // 使用火山引擎SDK
      const client = new ArkRuntimeClient({
        apiKey: textModelConfig.apiKey,
      });
      
      const response = await client.createChatCompletion({
        model: textModelConfig.modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        ...parameters
      });
      
      const content = response.choices[0].message.content;
      return typeof content === 'string' ? content : JSON.stringify(content);
    } else {
      // 使用OpenAI客户端
      const openai = new OpenAI({
        apiKey: textModelConfig.apiKey,
        baseURL: textModelConfig.baseUrl,
      });
      
      const response = await openai.chat.completions.create({
        model: textModelConfig.modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        ...parameters
      });
      
      return response.choices[0].message.content || '';
    }
  } catch (error) {
    console.error('文本生成失败:', error);
    throw error;
  }
};

// 图像生成
const generateImage = async (prompt: string, model: string, parameters: any): Promise<string> => {
  const config = getConfig();
  const imageModelConfig = config.imageModel;
  
  try {
    if (imageModelConfig.provider === 'volcengine') {
      // 使用火山引擎SDK
      const client = new ArkRuntimeClient({
        apiKey: imageModelConfig.apiKey,
      });
      
      // 使用 images.generate 方法，与 OpenAI SDK 兼容
      const response = await (client as any).images.generate({
        model: imageModelConfig.modelName,
        prompt: prompt,
        n: parameters.n || 1,
        size: parameters.size || '1024x1024',
        ...parameters
      });
      
      return response.data[0].url || '';
    } else {
      // 使用OpenAI客户端
      const openai = new OpenAI({
        apiKey: imageModelConfig.apiKey,
        baseURL: imageModelConfig.baseUrl,
      });
      
      const response = await openai.images.generate({
        model: imageModelConfig.modelName,
        prompt: prompt,
        n: parameters.n || 1,
        size: parameters.size || '1024x1024',
        ...parameters
      });
      
      return response.data[0].url || '';
    }
  } catch (error) {
    console.error('图像生成失败:', error);
    throw error;
  }
};

// 视频生成
const generateVideo = async (prompt: string, model: string, parameters: any): Promise<string> => {
  const config = getConfig();
  const videoModelConfig = config.videoModel;
  
  try {
    if (videoModelConfig.provider === 'volcengine') {
      // 使用火山引擎SDK
      const client = new ArkRuntimeClient({
        apiKey: videoModelConfig.apiKey,
      });
      
      // 创建视频生成任务
      const createResponse = await (client as any).content_generation.tasks.create({
        model: videoModelConfig.modelName,
        content: [
          {
            type: 'text',
            text: prompt
          }
        ],
        resolution: parameters.resolution || '720p',
        ratio: parameters.ratio || '16:9',
        duration: parameters.duration || 5,
        ...parameters
      });
      
      const taskId = createResponse.id;
      
      // 轮询任务状态
      let taskStatus = 'queued';
      let taskResult: any = null;
      let pollingCount = 0;
      const maxPollingCount = 60; // 最多轮询60次
      const pollingInterval = 5000; // 每5秒轮询一次
      
      while (taskStatus !== 'succeeded' && taskStatus !== 'failed' && pollingCount < maxPollingCount) {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        taskResult = await (client as any).content_generation.tasks.get({
          task_id: taskId
        });
        taskStatus = taskResult.status;
        pollingCount++;
      }
      
      if (taskStatus === 'succeeded' && taskResult.output && taskResult.output.video) {
        return taskResult.output.video.url || '';
      } else {
        throw new Error(`视频生成失败: ${taskResult.error?.message || 'Unknown error'}`);
      }
    } else {
      // 注意：OpenAI目前没有提供视频生成API
      // 这里使用模拟数据，实际项目中可以接入其他视频生成服务
      return new Promise((resolve) => {
        setTimeout(() => {
          // 使用占位符视频
          const videoUrl = 'https://example.com/placeholder-video.mp4';
          resolve(videoUrl);
        }, 3000);
      });
    }
  } catch (error) {
    console.error('视频生成失败:', error);
    throw error;
  }
};

// 文本生成
router.post('/text/generate', async (req, res) => {
  const { prompt, model, parameters, studentId, studentName } = req.body;
  
  if (!prompt || !studentId || !studentName) {
    return res.json({ success: false, error: '请输入提示词和学生信息' });
  }
  
  try {
    const result = await generateText(prompt, model || 'deepseek', parameters || {});
    
    // 保存历史记录
    const historyItem = {
      id: Date.now().toString(),
      type: 'text',
      prompt,
      parameters,
      result,
      timestamp: Date.now(),
      model: model || 'deepseek',
      studentId,
      studentName
    };
    saveHistory(historyItem);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: '生成失败，请重试' });
  }
});

// 图像生成
router.post('/image/generate', async (req, res) => {
  const { prompt, model, parameters, studentId, studentName } = req.body;
  
  if (!prompt || !studentId || !studentName) {
    return res.json({ success: false, error: '请输入提示词和学生信息' });
  }
  
  try {
    const result = await generateImage(prompt, model || 'deepseek', parameters || {});
    
    // 保存历史记录
    const historyItem = {
      id: Date.now().toString(),
      type: 'image',
      prompt,
      parameters,
      result,
      timestamp: Date.now(),
      model: model || 'deepseek',
      studentId,
      studentName
    };
    saveHistory(historyItem);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: '生成失败，请重试' });
  }
});

// 视频生成
router.post('/video/generate', async (req, res) => {
  const { prompt, model, parameters, studentId, studentName } = req.body;
  
  if (!prompt || !studentId || !studentName) {
    return res.json({ success: false, error: '请输入提示词和学生信息' });
  }
  
  try {
    const result = await generateVideo(prompt, model || 'deepseek', parameters || {});
    
    // 保存历史记录
    const historyItem = {
      id: Date.now().toString(),
      type: 'video',
      prompt,
      parameters,
      result,
      timestamp: Date.now(),
      model: model || 'deepseek',
      studentId,
      studentName
    };
    saveHistory(historyItem);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: '生成失败，请重试' });
  }
});

// 获取历史记录
router.get('/history', (req, res) => {
  ensureDataDir();
  const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
  res.json({ success: true, data: history });
});

// 删除历史记录
router.delete('/history', (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.json({ success: false, error: '请输入历史记录ID' });
  }
  
  ensureDataDir();
  const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
  const filteredHistory = history.filter((item: any) => item.id !== id);
  
  if (filteredHistory.length === history.length) {
    return res.json({ success: false, error: '历史记录不存在' });
  }
  
  fs.writeFileSync(historyFilePath, JSON.stringify(filteredHistory, null, 2));
  res.json({ success: true });
});

// 获取配置
router.get('/config', (req, res) => {
  const config = getConfig();
  res.json({ success: true, data: config });
});

// 更新配置
router.post('/config', (req, res) => {
  const { textModel, imageModel, videoModel, systemSettings } = req.body;
  
  try {
    const config = getConfig();
    const updatedConfig = {
      textModel: textModel || config.textModel,
      imageModel: imageModel || config.imageModel,
      videoModel: videoModel || config.videoModel,
      systemSettings: systemSettings || config.systemSettings
    };
    
    fs.writeFileSync(configFilePath, JSON.stringify(updatedConfig, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: '更新配置失败' });
  }
});

export default router;
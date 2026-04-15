import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const TextGenerator: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的吗？',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 检查登录状态
  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    const name = localStorage.getItem('name');
    if (!studentId || !name) {
      window.location.href = '/';
    } else {
      setStudentInfo({ id: studentId, name });
    }
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      imageUrl: imagePreview
    };

    setMessages(prev => [...prev, userMessage]);
    const prompt = input.trim();
    setInput('');
    setLoading(true);

    try {
      // 获取配置
      const configResponse = await fetch('/api/config');
      const configData = await configResponse.json();
      const textModel = configData.success ? configData.data.textModel : { provider: 'deepseek' };
      
      if (selectedImage) {
        // 带图片的请求
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('model', textModel.provider);
        formData.append('parameters', JSON.stringify({ maxTokens: 1000 }));
        formData.append('studentId', studentInfo.id);
        formData.append('studentName', studentInfo.name);
        formData.append('image', selectedImage);
        
        const response = await fetch('/api/text/generate', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.data,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // 添加错误消息
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '抱歉，生成失败了，请重试。',
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // 普通文本请求
        const response = await fetch('/api/text/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model: textModel.provider,
            parameters: {
              maxTokens: 1000,
            },
            studentId: studentInfo.id,
            studentName: studentInfo.name,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.data,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // 添加错误消息
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '抱歉，生成失败了，请重试。',
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '网络错误，请检查连接后重试。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // 清除图片
      handleRemoveImage();
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('请上传 JPG、PNG 或 WebP 格式的图片');
      return;
    }

    // 验证文件大小
    if (file.size > MAX_IMAGE_SIZE) {
      alert('哎呀，图片太大了，请压缩到 5MB 以内哦！');
      return;
    }

    // 生成预览
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // 模拟文件输入事件
      const event = { target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(event);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentId');
    localStorage.removeItem('name');
    window.location.href = '/';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href="/text" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI 授课系统
            </a>
            <div className="hidden md:flex items-center space-x-1">
              <a href="/text" className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">文本生成</a>
              <a href="/image" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">图像生成</a>
              <a href="/video" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">视频生成</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              {studentInfo.name} ({studentInfo.id})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </nav>

      {/* 移动端导航 */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2">
        <div className="flex space-x-1">
          <a href="/text" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">文本</a>
          <a href="/image" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600">图像</a>
          <a href="/video" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600">视频</a>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] md:max-w-[70%]`}>
                <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* 头像 */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold shadow-md ${message.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'}`}>
                    {message.role === 'user' ? studentInfo.name.charAt(0) : 'AI'}
                  </div>
                  {/* 消息内容 */}
                  <div className={`p-4 rounded-2xl ${message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                    {message.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <img 
                          src={message.imageUrl} 
                          alt="用户上传" 
                          className="w-full h-auto max-h-48 object-cover"
                        />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] md:max-w-[70%]">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg font-semibold shadow-md">
                    AI
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSendMessage} className="space-y-3">
            {/* 图片预览区 */}
            {imagePreview && (
              <div className="relative">
                <div className="rounded-2xl overflow-hidden border-2 border-blue-200">
                  <img 
                    src={imagePreview} 
                    alt="预览" 
                    className="w-full h-auto max-h-64 object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white hover:shadow-md transition-all"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div 
              className="relative" 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <textarea
                className="w-full px-5 py-4 pr-16 pl-16 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none text-slate-800 placeholder-slate-400"
                rows={1}
                placeholder="输入你的问题..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
              />
              
              {/* 图片上传按钮 */}
              <div className="absolute left-3 bottom-3">
                <label
                  htmlFor="image-upload"
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <input
                    ref={fileInputRef}
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading || (!input.trim() && !selectedImage)}
                className="absolute right-3 bottom-3 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TextGenerator;
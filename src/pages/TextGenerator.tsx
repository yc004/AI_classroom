import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  files?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  timestamp: number;
}

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 清理ObjectURL的函数
  const cleanupObjectUrls = () => {
    messages.forEach(message => {
      if (message.imageUrl && message.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(message.imageUrl);
      }
      if (message.files) {
        message.files.forEach(file => {
          if (file.url.startsWith('blob:')) {
            URL.revokeObjectURL(file.url);
          }
        });
      }
    });
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupObjectUrls();
    };
  }, []);

  // 图片转Base64的辅助函数
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

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
    if (!input.trim() && !selectedImage && selectedFiles.length === 0) return;

    // 处理图片预览
    let imageUrl: string | undefined;
    if (selectedImage) {
      imageUrl = URL.createObjectURL(selectedImage);
    }

    // 处理文件预览
    let files: Array<{ name: string; url: string; type: string }> | undefined;
    if (selectedFiles.length > 0) {
      files = selectedFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      imageUrl,
      files,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const prompt = input.trim();
    setInput('');
    setSelectedImage(null);
    setSelectedFiles([]);
    setLoading(true);

    try {
      // 获取配置
      const configResponse = await fetch('/api/config');
      const configData = await configResponse.json();
      const textModel = configData.success ? configData.data.textModel : { provider: 'deepseek' };
      
      // 准备请求数据
      const requestData: any = {
        prompt,
        model: textModel.provider,
        parameters: {
          maxTokens: 1000,
        },
        studentId: studentInfo.id,
        studentName: studentInfo.name,
      };

      // 如果有图片，转换为Base64
      if (selectedImage) {
        const base64Image = await fileToBase64(selectedImage);
        requestData.image = base64Image;
      }

      // 如果有文件，转换为Base64
      if (selectedFiles.length > 0) {
        const base64Files = await Promise.all(
          selectedFiles.map(async (file) => ({
            name: file.name,
            type: file.type,
            content: await fileToBase64(file)
          }))
        );
        requestData.files = base64Files;
      }
      
      const response = await fetch('/api/text/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '网络错误，请检查连接后重试。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
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
    <PageTransition className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      {/* 顶部导航栏 */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href="/text" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Classroom
            </a>
            <div className="hidden md:flex items-center space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-1">
              <a href="/text" className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white">文本生成</a>
              <a href="/image" className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">图像生成</a>
              <a href="/video" className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">视频生成</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/80 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              {studentInfo.name} ({studentInfo.id})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/70 hover:text-red-400"
            >
              退出
            </Button>
          </div>
        </div>
      </nav>

      {/* 移动端导航 */}
      <div className="md:hidden bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-2">
        <div className="flex space-x-1">
          <a href="/text" className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white">文本</a>
          <a href="/image" className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-medium text-white/70">图像</a>
          <a href="/video" className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-medium text-white/70">视频</a>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] md:max-w-[70%]`}>
                <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* 头像 */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold shadow-md ${message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white'}`}>
                    {message.role === 'user' ? studentInfo.name.charAt(0) : 'AI'}
                  </div>
                  {/* 消息内容 */}
                  <div className={`p-4 rounded-2xl ${message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm' : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-tl-sm'}`}>
                    {message.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={message.imageUrl} 
                          alt="Message image" 
                          className="w-full max-w-sm rounded-lg border border-white/10 shadow-sm object-cover"
                        />
                      </div>
                    )}
                    {message.files && message.files.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {message.files.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{file.name}</div>
                            <div className="text-xs text-white/60">{file.type || '文件'}</div>
                          </div>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>)
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-white/60'}`}>
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
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center text-lg font-semibold shadow-md">
                    AI
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 rounded-tl-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
      <div className="bg-white/5 backdrop-blur-md border-t border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="relative">
              <Textarea
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
                fullWidth
                className="pr-36 min-h-[80px]"
              />
              {/* 文件上传按钮 */}
              <div className="absolute right-28 bottom-3">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 text-white/70 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </label>
              </div>
              {/* 图片上传按钮 */}
              <div className="absolute right-20 bottom-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedImage(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 text-white/70 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </label>
              </div>
              {/* 已选择文件预览 */}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {selectedImage && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Selected image" 
                      className="w-10 h-10 rounded-md object-cover"
                    />
                  </div>
                )}
                {selectedFiles.slice(0, 3).map((file, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/10 flex items-center space-x-1">
                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-white/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-xs text-white/80 truncate max-w-[80px]">{file.name}</div>
                  </div>
                ))}
                {selectedFiles.length > 3 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/10 px-2 text-xs text-white/80">
                    +{selectedFiles.length - 3}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || (!input.trim() && !selectedImage && selectedFiles.length === 0)}
                loading={loading}
                size="sm"
                variant="primary"
                className="absolute right-3 bottom-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default TextGenerator;
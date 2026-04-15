import React, { useState, useEffect, useRef } from 'react';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' });
  const [videoDuration, setVideoDuration] = useState(5);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image'); // 'image' for 首帧图片, 'video' for 基础视频
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    const name = localStorage.getItem('name');
    if (!studentId || !name) {
      window.location.href = '/';
    } else {
      setStudentInfo({ id: studentId, name });
    }
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('请输入视频描述');
      return;
    }

    setError('');
    setLoading(true);
    setResult('');

    try {
      // 获取配置
      const configResponse = await fetch('/api/config');
      const configData = await configResponse.json();
      const videoModel = configData.success ? configData.data.videoModel : { provider: 'deepseek' };
      
      if (uploadedFile) {
        // 带文件的请求
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('model', videoModel.provider);
        formData.append('parameters', JSON.stringify({ 
          duration: videoDuration 
        }));
        formData.append('studentId', studentInfo.id);
        formData.append('studentName', studentInfo.name);
        formData.append(uploadType === 'image' ? 'firstFrame' : 'baseVideo', uploadedFile);
        
        const response = await fetch('/api/video/generate', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.error || '生成失败');
        }
      } else {
        // 普通文本请求
        const response = await fetch('/api/video/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model: videoModel.provider,
            parameters: {
              duration: videoDuration,
            },
            studentId: studentInfo.id,
            studentName: studentInfo.name,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.error || '生成失败');
        }
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型和大小
    if (uploadType === 'image') {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('请上传 JPG、PNG 或 WebP 格式的图片');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError('哎呀，图片太大了，请压缩到 5MB 以内哦！');
        return;
      }
    } else {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        setError('请上传 MP4 格式的视频');
        return;
      }
      if (file.size > MAX_VIDEO_SIZE) {
        setError('视频太大了，请压缩到 20MB 以内哦！');
        return;
      }
    }

    // 生成预览
    const previewUrl = URL.createObjectURL(file);
    setUploadedFile(file);
    setFilePreview(previewUrl);
    setError('');
  };

  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setUploadedFile(null);
    setFilePreview(null);
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
      handleFileUpload(event);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentId');
    localStorage.removeItem('name');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href="/text" className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              AI 授课系统
            </a>
            <div className="hidden md:flex items-center space-x-1">
              <a href="/text" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">文本生成</a>
              <a href="/image" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">图像生成</a>
              <a href="/video" className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-700">视频生成</a>
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

      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2">
        <div className="flex space-x-1">
          <a href="/text" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600">文本</a>
          <a href="/image" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600">图像</a>
          <a href="/video" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-700">视频</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            🎬 视频生成
          </h1>
          <p className="text-slate-600">让你的想象动起来，创作精彩视频</p>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6 max-w-3xl mx-auto">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-semibold text-slate-700 mb-2">
                    视频描述
                  </label>
                  <textarea
                    id="prompt"
                    name="prompt"
                    rows={5}
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all resize-none text-slate-800 placeholder-slate-400"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入视频描述，例如：一只小鸟在森林中飞翔的场景..."
                  />
                </div>

                {/* 上传类型选择 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    上传类型
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadType('image');
                        handleRemoveFile();
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${uploadType === 'image' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      上传首帧图片
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadType('video');
                        handleRemoveFile();
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${uploadType === 'video' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      上传基础视频
                    </button>
                  </div>
                </div>

                {/* 文件上传区域 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {uploadType === 'image' ? '首帧图片' : '基础视频'}
                  </label>
                  <div 
                    className={`border-2 ${filePreview ? 'border-orange-200' : 'border-dashed border-slate-300'} rounded-xl p-6 text-center transition-all hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.5)]`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {filePreview ? (
                      <div className="relative">
                        {uploadType === 'image' ? (
                          <img 
                            src={filePreview} 
                            alt={uploadType === 'image' ? '首帧图片' : '基础视频'} 
                            className="w-full h-auto max-h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <video 
                            src={filePreview} 
                            alt="基础视频" 
                            className="w-full h-auto max-h-48 object-cover rounded-lg"
                            controls
                          />
                        )}
                        <div className="absolute top-2 right-2 flex space-x-2">
                          <label
                            htmlFor="file-upload"
                            className="p-2 bg-white/80 rounded-full hover:bg-white hover:shadow-md transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 bg-white/80 rounded-full hover:bg-white hover:shadow-md transition-all"
                          >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-slate-500 mb-2">点击或拖拽上传{uploadType === 'image' ? '首帧图片' : '基础视频'}</p>
                        <label
                          htmlFor="file-upload"
                          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all cursor-pointer inline-block"
                        >
                          选择文件
                        </label>
                        <input
                          ref={fileInputRef}
                          id="file-upload"
                          type="file"
                          accept={uploadType === 'image' ? 'image/*' : 'video/mp4'}
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="videoDuration" className="block text-sm font-semibold text-slate-700 mb-2">
                    视频时长
                  </label>
                  <select
                    id="videoDuration"
                    name="videoDuration"
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-slate-800"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                  >
                    <option value={5}>5秒 (快速)</option>
                    <option value={10}>10秒 (标准)</option>
                    <option value={15}>15秒 (中等)</option>
                    <option value={20}>20秒 (详细)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      生成中...
                    </span>
                  ) : (
                    '🎬 生成视频'
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">生成结果</h2>
                <div className="bg-slate-50 rounded-xl overflow-hidden shadow-inner">
                  <video controls className="w-full h-auto">
                    <source src={result} type="video/mp4" />
                    您的浏览器不支持视频播放。
                  </video>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 border-dashed p-12 text-center">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">准备就绪</h3>
                <p className="text-slate-500">输入描述，开始创作视频吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
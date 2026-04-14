import React, { useState, useEffect } from 'react';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' });
  const [imageSize, setImageSize] = useState('1024x1024');

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
      setError('请输入图像描述');
      return;
    }

    setError('');
    setLoading(true);
    setResult('');

    try {
      // 获取配置
      const configResponse = await fetch('/api/config');
      const configData = await configResponse.json();
      const imageModel = configData.success ? configData.data.imageModel : { provider: 'deepseek' };
      
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: imageModel.provider,
          parameters: {
            size: imageSize,
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
    } catch (err) {
      setError('网络错误，请重试');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href="/text" className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI 授课系统
            </a>
            <div className="hidden md:flex items-center space-x-1">
              <a href="/text" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">文本生成</a>
              <a href="/image" className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700">图像生成</a>
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

      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2">
        <div className="flex space-x-1">
          <a href="/text" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600">文本</a>
          <a href="/image" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700">图像</a>
          <a href="/video" className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600">视频</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            🎨 图像生成
          </h1>
          <p className="text-slate-600">用文字描述你的想象，让AI为你创作</p>
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
                    图像描述
                  </label>
                  <textarea
                    id="prompt"
                    name="prompt"
                    rows={5}
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all resize-none text-slate-800 placeholder-slate-400"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入图像描述，例如：一只可爱的小猫在阳光下玩耍..."
                  />
                </div>

                <div>
                  <label htmlFor="imageSize" className="block text-sm font-semibold text-slate-700 mb-2">
                    图像尺寸
                  </label>
                  <select
                    id="imageSize"
                    name="imageSize"
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-slate-800"
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                  >
                    <option value="512x512">512x512 (快速)</option>
                    <option value="1024x1024">1024x1024 (标准)</option>
                    <option value="1024x1536">1024x1536 (纵向)</option>
                    <option value="1536x1024">1536x1024 (横向)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
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
                    '✨ 生成图像'
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
                  <img src={result} alt="生成的图像" className="w-full h-auto" />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 border-dashed p-12 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">准备就绪</h3>
                <p className="text-slate-500">输入描述，开始创作吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
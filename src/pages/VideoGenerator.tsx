import React, { useState, useEffect } from 'react';

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' });
  const [videoDuration, setVideoDuration] = useState(5);

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
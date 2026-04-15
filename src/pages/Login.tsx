import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import PageTransition from '../components/PageTransition';

const Login: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, name }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('studentId', data.studentId);
        localStorage.setItem('name', data.name);
        window.location.href = '/text';
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col md:flex-row">
      {/* 左侧背景和标语 */}
      <div className="md:w-1/2 relative flex items-center justify-center p-8 overflow-hidden">
        {/* 动态光斑效果 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-lg">
            <span className="text-5xl">🤖</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Classroom
          </h1>
          <p className="text-xl text-white/80 max-w-md mx-auto">
            探索人工智能的无限可能，开启智慧学习之旅
          </p>
          <div className="mt-8 space-y-2 text-white/60 text-sm">
            <p>🚀 智能文本生成</p>
            <p>🎨 创意图像创作</p>
            <p>🎬 精彩视频生成</p>
          </div>
        </div>
      </div>

      {/* 右侧登录卡片 */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 教师入口按钮 */}
          <div className="flex justify-end mb-6">
            <a 
              href="/config" 
              className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
            >
              <span>👨‍🏫</span>
              <span>教师入口</span>
            </a>
          </div>

          <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-8 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              学生登录
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <Input
                label="学号"
                id="studentId"
                name="studentId"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="请输入学号"
                prefixIcon="👤"
                error={error}
                fullWidth
              />

              <Input
                label="姓名"
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名"
                prefixIcon="✏️"
                error={error}
                fullWidth
              />

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                glow
                className="animate-pulse-slow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? '登录中...' : '进入课堂'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-white/60">
                八年级学生专用系统
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              © 2026 AI Classroom
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
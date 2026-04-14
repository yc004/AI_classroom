import React, { useState, useEffect } from 'react';

interface Student {
  id: string;
  studentId: string;
  name: string;
  createdAt: number;
}

interface ModelConfig {
  provider: string;
  baseUrl: string;
  modelName: string;
  apiKey: string;
}

interface Config {
  textModel: ModelConfig;
  imageModel: ModelConfig;
  videoModel: ModelConfig;
  systemSettings: {
    port: number;
    allowLanAccess: boolean;
    rateLimit: number;
  };
}

const Config: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [config, setConfig] = useState<Config>({
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
  });
  const [newStudent, setNewStudent] = useState({ studentId: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('textModel');

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/auth/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error('获取学生名单失败:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        // 检查返回的数据结构是否符合新的格式
        const configData = data.data;
        if (configData.textModel && configData.imageModel && configData.videoModel) {
          // 新格式，直接使用
          setConfig(configData);
        } else {
          // 旧格式，转换为新格式
          const transformedConfig: Config = {
            textModel: {
              provider: configData.modelSettings?.defaultModel || 'deepseek',
              baseUrl: 'https://api.deepseek.com/v1',
              modelName: 'deepseek-chat',
              apiKey: String(Object.values(configData.apiKeys || {})[0] || '')
            },
            imageModel: {
              provider: configData.modelSettings?.defaultModel || 'deepseek',
              baseUrl: 'https://api.deepseek.com/v1',
              modelName: 'deepseek-vision',
              apiKey: String(Object.values(configData.apiKeys || {})[0] || '')
            },
            videoModel: {
              provider: configData.modelSettings?.defaultModel || 'deepseek',
              baseUrl: 'https://api.deepseek.com/v1',
              modelName: 'deepseek-video',
              apiKey: String(Object.values(configData.apiKeys || {})[0] || '')
            },
            systemSettings: configData.systemSettings || {
              port: 3001,
              allowLanAccess: true,
              rateLimit: 100
            }
          };
          setConfig(transformedConfig);
        }
      }
    } catch (err) {
      console.error('获取配置失败:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchConfig();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.studentId || !newStudent.name) {
      setError('请输入学号和姓名');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('添加学生成功');
        setNewStudent({ studentId: '', name: '' });
        fetchStudents();
      } else {
        setError(data.error || '添加失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('确定要删除这个学生吗？')) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('删除学生成功');
        fetchStudents();
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('更新配置成功');
      } else {
        setError(data.error || '更新失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            🔧 配置管理
          </a>
          <a href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            返回首页
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            {success}
          </div>
        )}

        <div className="flex space-x-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('textModel')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'textModel' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            📝 文本模型
          </button>
          <button
            onClick={() => setActiveTab('imageModel')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'imageModel' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            🖼️ 图像模型
          </button>
          <button
            onClick={() => setActiveTab('videoModel')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'videoModel' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            🎬 视频模型
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'students' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            👥 学生名单
          </button>
          <a
            href="/history"
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-center transition-all text-slate-600 hover:bg-slate-50"
          >
            📜 历史记录
          </a>
        </div>

        {activeTab === 'textModel' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3">📝</span>
              文本模型配置
            </h2>
            <form onSubmit={handleUpdateConfig} className="space-y-6">
              <div>
                <label htmlFor="textProvider" className="block text-sm font-semibold text-slate-700 mb-2">
                  模型提供商
                </label>
                <select
                  id="textProvider"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800"
                  value={config.textModel.provider}
                  onChange={(e) => setConfig({
                    ...config,
                    textModel: { ...config.textModel, provider: e.target.value }
                  })}
                >
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <label htmlFor="textBaseUrl" className="block text-sm font-semibold text-slate-700 mb-2">
                  API Base URL
                </label>
                <input
                  id="textBaseUrl"
                  type="text"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800"
                  value={config.textModel.baseUrl}
                  onChange={(e) => setConfig({
                    ...config,
                    textModel: { ...config.textModel, baseUrl: e.target.value }
                  })}
                />
              </div>
              <div>
                <label htmlFor="textModelName" className="block text-sm font-semibold text-slate-700 mb-2">
                  模型名称
                </label>
                <input
                  id="textModelName"
                  type="text"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800"
                  value={config.textModel.modelName}
                  onChange={(e) => setConfig({
                    ...config,
                    textModel: { ...config.textModel, modelName: e.target.value }
                  })}
                />
              </div>
              <div>
                <label htmlFor="textApiKey" className="block text-sm font-semibold text-slate-700 mb-2">
                  API Key
                </label>
                <input
                  id="textApiKey"
                  type="password"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800"
                  value={config.textModel.apiKey}
                  onChange={(e) => setConfig({
                    ...config,
                    textModel: { ...config.textModel, apiKey: e.target.value }
                  })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 font-semibold text-lg"
              >
                {loading ? '保存中...' : '💾 保存配置'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'imageModel' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3">🖼️</span>
              图像模型配置
            </h2>
            <form onSubmit={handleUpdateConfig} className="space-y-6">
              <div>
                <label htmlFor="imageProvider" className="block text-sm font-semibold text-slate-700 mb-2">
                  模型提供商
                </label>
                <select
                  id="imageProvider"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-slate-800"
                  value={config.imageModel.provider}
                  onChange={(e) => setConfig({
                    ...config,
                    imageModel: { ...config.imageModel, provider: e.target.value }
                  })}
                >
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <label htmlFor="imageBaseUrl" className="block text-sm font-semibold text-slate-700 mb-2">
                  API Base URL
                </label>
                <input
                  id="imageBaseUrl"
                  type="text"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-slate-800"
                  value={config.imageModel.baseUrl}
                  onChange={(e) => setConfig({
                    ...config,
                    imageModel: { ...config.imageModel, baseUrl: e.target.value }
                  })}
                />
              </div>
              <div>
                <label htmlFor="imageModelName" className="block text-sm font-semibold text-slate-700 mb-2">
                  模型名称
                </label>
                <input
                  id="imageModelName"
                  type="text"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-slate-800"
                  value={config.imageModel.modelName}
                  onChange={(e) => setConfig({
                    ...config,
                    imageModel: { ...config.imageModel, modelName: e.target.value }
                  })}
                />
              </div>
              <div>
                <label htmlFor="imageApiKey" className="block text-sm font-semibold text-slate-700 mb-2">
                  API Key
                </label>
                <input
                  id="imageApiKey"
                  type="password"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-slate-800"
                  value={config.imageModel.apiKey}
                  onChange={(e) => setConfig({
                    ...config,
                    imageModel: { ...config.imageModel, apiKey: e.target.value }
                  })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50 font-semibold text-lg"
              >
                {loading ? '保存中...' : '💾 保存配置'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'videoModel' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3">🎬</span>
              视频模型配置
            </h2>
            <form onSubmit={handleUpdateConfig} className="space-y-6">
              <div>
                <label htmlFor="videoProvider" className="block text-sm font-semibold text-slate-700 mb-2">
                  模型提供商
                </label>
                <select
                  id="videoProvider"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-slate-800"
                  value={config.videoModel.provider}
                  onChange={(e) => setConfig({
                    ...config,
                    videoModel: { ...config.videoModel, provider: e.target.value }
                  })}
                >
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <label htmlFor="videoBaseUrl" className="block text-sm font-semibold text-slate-700 mb-2">
                  API Base URL
                </label>
                <input
                  id="videoBaseUrl"
                  type="text"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-slate-800"
                  value={config.videoModel.baseUrl}
                  onChange={(e) => setConfig({
                    ...config,
                    videoModel: { ...config.videoModel, baseUrl: e.target.value }
                  })}
                />
              </div>
              <div>
                <label htmlFor="videoModelName" className="block text-sm font-semibold text-slate-700 mb-2">
                  模型名称
                </label>
                <input
                  id="videoModelName"
                  type="text"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-slate-800"
                  value={config.videoModel.modelName}
                  onChange={(e) => setConfig({
                    ...config,
                    videoModel: { ...config.videoModel, modelName: e.target.value }
                  })}
                />
              </div>
              <div>
                <label htmlFor="videoApiKey" className="block text-sm font-semibold text-slate-700 mb-2">
                  API Key
                </label>
                <input
                  id="videoApiKey"
                  type="password"
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-slate-800"
                  value={config.videoModel.apiKey}
                  onChange={(e) => setConfig({
                    ...config,
                    videoModel: { ...config.videoModel, apiKey: e.target.value }
                  })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all disabled:opacity-50 font-semibold text-lg"
              >
                {loading ? '保存中...' : '💾 保存配置'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3">👥</span>
              学生名单管理
            </h2>
            <form onSubmit={handleAddStudent} className="mb-8">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-semibold text-slate-700 mb-2">
                    学号
                  </label>
                  <input
                    id="studentId"
                    type="text"
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-slate-800"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    姓名
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-slate-800"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all disabled:opacity-50 font-semibold text-lg"
              >
                {loading ? '添加中...' : '➕ 添加学生'}
              </button>
            </form>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      学号
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      姓名
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Config;
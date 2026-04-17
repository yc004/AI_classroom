import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';

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

interface VideoModelConfig {
  modelName: string;
  apiKey: string;
}

interface Config {
  textModel: ModelConfig;
  imageModel: ModelConfig;
  videoModel: VideoModelConfig;
  systemSettings: {
    port: number;
    allowLanAccess: boolean;
    rateLimit: number;
  };
}

const VIDEO_MODEL_OPTIONS = [
  { value: 'doubao-seedance-1-0-lite-t2v-250428', label: 'Seedance 1.0 Lite T2V' },
  { value: 'doubao-seedance-1-0-pro-250528', label: 'Seedance 1.0 Pro' },
  { value: 'doubao-seedance-1-0-pro-fast-250610', label: 'Seedance 1.0 Pro Fast' },
  { value: 'doubao-seedance-1-5-pro-251215', label: 'Seedance 1.5 Pro' }
];

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
      modelName: 'doubao-seedance-1-0-lite-t2v-250428',
      apiKey: ''
    },
    systemSettings: {
      port: 3001,
      allowLanAccess: true,
      rateLimit: 100
    }
  });
  const [newStudent, setNewStudent] = useState({ studentId: '', name: '' });
  const [batchInput, setBatchInput] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchResult, setBatchResult] = useState<{
    total: number;
    added: number;
    duplicated: number;
    invalid: number;
    invalidLines: string[];
    duplicatedIds: string[];
  } | null>(null);
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
          setConfig({
            ...configData,
            videoModel: {
              modelName: configData.videoModel.modelName || 'doubao-seedance-1-0-lite-t2v-250428',
              apiKey: configData.videoModel.apiKey || ''
            }
          });
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
              modelName: 'doubao-seedance-1-0-lite-t2v-250428',
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

  useEffect(() => {
    setSelectedStudentIds((prev) => prev.filter((id) => students.some((student) => student.id === id)));
  }, [students]);

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

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const handleToggleSelectAllStudents = () => {
    if (students.length === 0) return;
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
      return;
    }
    setSelectedStudentIds(students.map((student) => student.id));
  };

  const handleBatchDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) {
      setError('请先选择要删除的学生');
      return;
    }

    if (!confirm(`确定要批量删除 ${selectedStudentIds.length} 名学生吗？`)) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/students/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedStudentIds }),
      });

      const data = await response.json();
      if (data.success) {
        const deletedCount = data.data?.deleted ?? 0;
        setSuccess(`批量删除成功：已删除 ${deletedCount} 人`);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        setError(data.error || '批量删除失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchInput.trim()) {
      setError('请先输入要导入的学生数据');
      return;
    }

    setError('');
    setSuccess('');
    setBatchResult(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/students/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: batchInput }),
      });

      const data = await response.json();
      if (data.success) {
        const result = data.data;
        setBatchResult(result);
        setSuccess(`批量导入完成：新增 ${result.added} 人`);
        setBatchInput('');
        fetchStudents();
      } else {
        setError(data.error || '批量导入失败');
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
    if (activeTab === 'videoModel' && !config.videoModel.modelName.trim()) {
      setError('请选择或填写视频模型 ID');
      return;
    }
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
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🔧 配置管理
          </a>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/'}
          >
            返回首页
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-2xl">
            {success}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeTab === 'textModel' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('textModel')}
            className={activeTab === 'textModel' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
          >
            📝 文本模型
          </Button>
          <Button
            variant={activeTab === 'imageModel' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('imageModel')}
            className={activeTab === 'imageModel' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
          >
            🖼️ 图像模型
          </Button>
          <Button
            variant={activeTab === 'videoModel' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('videoModel')}
            className={activeTab === 'videoModel' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
          >
            🎬 视频模型
          </Button>
          <Button
            variant={activeTab === 'students' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('students')}
            className={activeTab === 'students' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
          >
            👥 学生名单
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/history'}
          >
            📜 历史记录
          </Button>
        </div>

        {activeTab === 'textModel' && (
          <Card title="文本模型配置" glow>
            <form onSubmit={handleUpdateConfig} className="space-y-6">
              <Select
                label="模型提供商"
                id="textProvider"
                value={config.textModel.provider}
                onChange={(e) => setConfig({
                  ...config,
                  textModel: { ...config.textModel, provider: e.target.value }
                })}
                fullWidth
              >
                <option value="openai">OpenAI</option>
                <option value="deepseek">DeepSeek</option>
                <option value="custom">自定义</option>
              </Select>
              <Input
                label="API Base URL"
                id="textBaseUrl"
                type="text"
                value={config.textModel.baseUrl}
                onChange={(e) => setConfig({
                  ...config,
                  textModel: { ...config.textModel, baseUrl: e.target.value }
                })}
                fullWidth
              />
              <Input
                label="模型名称"
                id="textModelName"
                type="text"
                value={config.textModel.modelName}
                onChange={(e) => setConfig({
                  ...config,
                  textModel: { ...config.textModel, modelName: e.target.value }
                })}
                fullWidth
              />
              <Input
                label="API Key"
                id="textApiKey"
                type="password"
                value={config.textModel.apiKey}
                onChange={(e) => setConfig({
                  ...config,
                  textModel: { ...config.textModel, apiKey: e.target.value }
                })}
                fullWidth
              />
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                glow
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? '保存中...' : '💾 保存配置'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'imageModel' && (
          <Card title="图像模型配置" glow>
            <form onSubmit={handleUpdateConfig} className="space-y-6">
              <Select
                label="模型提供商"
                id="imageProvider"
                value={config.imageModel.provider}
                onChange={(e) => setConfig({
                  ...config,
                  imageModel: { ...config.imageModel, provider: e.target.value }
                })}
                fullWidth
              >
                <option value="openai">OpenAI</option>
                <option value="deepseek">DeepSeek</option>
                <option value="custom">自定义</option>
              </Select>
              <Input
                label="API Base URL"
                id="imageBaseUrl"
                type="text"
                value={config.imageModel.baseUrl}
                onChange={(e) => setConfig({
                  ...config,
                  imageModel: { ...config.imageModel, baseUrl: e.target.value }
                })}
                fullWidth
              />
              <Input
                label="模型名称"
                id="imageModelName"
                type="text"
                value={config.imageModel.modelName}
                onChange={(e) => setConfig({
                  ...config,
                  imageModel: { ...config.imageModel, modelName: e.target.value }
                })}
                fullWidth
              />
              <Input
                label="API Key"
                id="imageApiKey"
                type="password"
                value={config.imageModel.apiKey}
                onChange={(e) => setConfig({
                  ...config,
                  imageModel: { ...config.imageModel, apiKey: e.target.value }
                })}
                fullWidth
              />
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                glow
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? '保存中...' : '💾 保存配置'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'videoModel' && (
          <Card title="视频模型配置" glow>
            <form onSubmit={handleUpdateConfig} className="space-y-6">
              {(() => {
                const isCustomModel = !VIDEO_MODEL_OPTIONS.some((item) => item.value === config.videoModel.modelName);
                return (
                  <>
              <Select
                label="模型选择"
                id="videoModelName"
                value={isCustomModel ? '__custom__' : config.videoModel.modelName}
                onChange={(e) => setConfig({
                  ...config,
                  videoModel: {
                    ...config.videoModel,
                    modelName: e.target.value === '__custom__' ? '' : e.target.value
                  }
                })}
                fullWidth
              >
                {VIDEO_MODEL_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
                <option value="__custom__">手动填写最新模型 ID</option>
              </Select>
              {(isCustomModel || !config.videoModel.modelName) && (
                <Input
                  label="模型 ID"
                  id="videoModelCustom"
                  type="text"
                  value={config.videoModel.modelName}
                  onChange={(e) => setConfig({
                    ...config,
                    videoModel: { ...config.videoModel, modelName: e.target.value }
                  })}
                  placeholder="例如：doubao-seedance-2-0-..."
                  fullWidth
                />
              )}
                  </>
                );
              })()}
              <Input
                label="API Key"
                id="videoApiKey"
                type="password"
                value={config.videoModel.apiKey}
                onChange={(e) => setConfig({
                  ...config,
                  videoModel: { ...config.videoModel, apiKey: e.target.value }
                })}
                fullWidth
              />
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                glow
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? '保存中...' : '💾 保存配置'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'students' && (
          <Card title="学生名单管理" glow>
            <form onSubmit={handleBatchImport} className="mb-8 p-6 border-2 border-dashed border-white/20 rounded-2xl bg-white/5">
              <h3 className="text-lg font-semibold text-white mb-3">批量导入学生</h3>
              <p className="text-sm text-white/70 mb-4">
                每行一条，支持格式：`学号,姓名` / `学号 姓名` / `学号[TAB]姓名`
              </p>
              <Textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder={`2026001,张三\n2026002 李四\n2026003\t王五`}
                rows={6}
                fullWidth
                className="mb-4"
              />
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? '导入中...' : '📥 批量导入'}
              </Button>
              {batchResult && (
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 space-y-1">
                  <p>总行数：{batchResult.total}</p>
                  <p>成功新增：{batchResult.added}</p>
                  <p>重复学号：{batchResult.duplicated}</p>
                  <p>格式错误：{batchResult.invalid}</p>
                  {batchResult.duplicatedIds.length > 0 && (
                    <p>重复示例：{batchResult.duplicatedIds.join('、')}</p>
                  )}
                  {batchResult.invalidLines.length > 0 && (
                    <p>错误行示例：{batchResult.invalidLines.join(' | ')}</p>
                  )}
                </div>
              )}
            </form>
            <form onSubmit={handleAddStudent} className="mb-8">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="学号"
                  id="studentId"
                  type="text"
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                  fullWidth
                />
                <Input
                  label="姓名"
                  id="name"
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  fullWidth
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? '添加中...' : '➕ 添加学生'}
              </Button>
            </form>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between">
                <p className="text-sm text-white/80">
                  已选择 {selectedStudentIds.length} / {students.length} 人
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleSelectAllStudents}
                  >
                    {selectedStudentIds.length === students.length && students.length > 0 ? '取消全选' : '全选'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleBatchDeleteStudents}
                    disabled={loading || selectedStudentIds.length === 0}
                  >
                    {loading ? '处理中...' : '批量删除'}
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={students.length > 0 && selectedStudentIds.length === students.length}
                          onChange={handleToggleSelectAllStudents}
                          className="h-4 w-4 rounded border-white/30 text-blue-500 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                        学号
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                        姓名
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/5 divide-y divide-white/10">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleToggleSelectStudent(student.id)}
                            className="h-4 w-4 rounded border-white/30 text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            删除
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default Config;

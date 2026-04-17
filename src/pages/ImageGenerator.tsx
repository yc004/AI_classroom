import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' });
  const [imageSize, setImageSize] = useState('1024x1024');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  
  // 图片转Base64的辅助函数
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

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
      
      // 准备请求数据
      const requestData: any = {
        prompt,
        model: imageModel.provider,
        parameters: {
          size: imageSize,
        },
        studentId: studentInfo.id,
        studentName: studentInfo.name,
      };

      // 如果有参考图，转换为Base64
      if (referenceImage) {
        const base64Image = await fileToBase64(referenceImage);
        requestData.referenceImage = base64Image;
      }
      
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
    <PageTransition className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      {/* 顶部导航栏 */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href="/text" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Classroom
            </a>
            <div className="hidden md:flex items-center space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-1">
              <a href="/text" className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">文本生成</a>
              <a href="/image" className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white">图像生成</a>
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
          <a href="/text" className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-medium text-white/70">文本</a>
          <a href="/image" className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white">图像</a>
          <a href="/video" className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-medium text-white/70">视频</a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              🎨 图像生成
            </h1>
            <p className="text-white/80">用文字描述你的想象，让AI为你创作</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl mb-6 max-w-3xl mx-auto">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card title="图像描述" glow>
                <form onSubmit={handleGenerate} className="space-y-6">
                  <Textarea
                    label="图像描述"
                    id="prompt"
                    name="prompt"
                    rows={5}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入图像描述，例如：一只可爱的小猫在阳光下玩耍..."
                    error={error}
                    fullWidth
                  />

                  <Select
                    label="图像尺寸"
                    id="imageSize"
                    name="imageSize"
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    fullWidth
                  >
                    <option value="512x512">512x512 (快速)</option>
                    <option value="1024x1024">1024x1024 (标准)</option>
                    <option value="1024x1536">1024x1536 (纵向)</option>
                    <option value="1536x1024">1536x1024 (横向)</option>
                  </Select>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-white/90">参考图上传</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setReferenceImage(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="reference-image-upload"
                    />
                    <label
                      htmlFor="reference-image-upload"
                      className="cursor-pointer p-6 border-2 border-dashed border-white/30 rounded-2xl hover:border-white/50 transition-all duration-300 text-center bg-white/5"
                    >
                      <div className="text-4xl mb-3">🖼️</div>
                      <p className="text-sm text-white/80">点击上传参考图</p>
                    </label>
                    {referenceImage && (
                      <div className="mt-3">
                        <img 
                          src={URL.createObjectURL(referenceImage)} 
                          alt="参考图" 
                          className="w-full h-36 rounded-xl object-cover border border-white/20 shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    loading={loading}
                    fullWidth
                    glow
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? '生成中...' : '✨ 生成图像'}
                  </Button>
                </form>
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="生成结果" glow>
                {result ? (
                  <div className="relative group">
                    <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                      <img 
                        src={result} 
                        alt="生成的图像" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(result)}
                        className="bg-white/20 hover:bg-white/30"
                      >
                        📋 复制链接
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(result, '_blank')}
                        className="bg-white/20 hover:bg-white/30"
                      >
                        🔍 放大查看
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-xl font-semibold text-white/80 mb-2">准备就绪</h3>
                    <p className="text-white/60">输入描述，开始创作吧！</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ImageGenerator;
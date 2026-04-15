import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';

interface HistoryItem {
  id: string;
  type: 'text' | 'image' | 'video';
  prompt: string;
  parameters: any;
  result: string;
  timestamp: number;
  model: string;
  studentId: string;
  studentName: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      if (data.success) {
        // 按时间倒序排序
        const sortedHistory = data.data.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
        const uniqueStudents = Array.from(
          new Set(sortedHistory.map((item: HistoryItem) => `${item.studentId}:${item.studentName}`))
        ).map((str: string) => {
          const [id, name] = str.split(':');
          return { id, name };
        });
        setStudents(uniqueStudents);
      } else {
        setError('获取历史记录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteHistory = async (id: string) => {
    if (!confirm('确定要删除这条历史记录吗？')) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('删除成功');
        fetchHistory();
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

  const filteredHistory = history.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStudent !== 'all' && item.studentId !== filterStudent) return false;
    if (searchQuery && !item.studentId.includes(searchQuery) && !item.studentName.includes(searchQuery)) return false;
    return true;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'video': return '🎬';
      default: return '📜';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'from-blue-600 to-indigo-600';
      case 'image': return 'from-purple-600 to-pink-600';
      case 'video': return 'from-orange-600 to-red-600';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              📜 历史记录
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.href = '/config'}
            >
              配置管理
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.href = '/'}
            >
              返回首页
            </Button>
          </div>
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

        <Card className="mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="生成类型"
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                fullWidth
              >
                <option value="all">全部</option>
                <option value="text">文本</option>
                <option value="image">图像</option>
                <option value="video">视频</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                label="学生筛选"
                id="filterStudent"
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                fullWidth
              >
                <option value="all">全部学生</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.id})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                label="搜索学号/姓名"
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="请输入学号或姓名"
                fullWidth
              />
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-lg font-semibold text-white/80">加载中...</p>
          </Card>
        ) : filteredHistory.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white/80 mb-2">暂无历史记录</h3>
            <p className="text-white/60">开始使用生成功能，记录会显示在这里</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item, index) => (
              <Card 
                key={item.id} 
                className="group overflow-hidden transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getTypeIcon(item.type)}</span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor(item.type)} text-white`}>
                      {item.type === 'text' ? '文本生成' : item.type === 'image' ? '图像生成' : '视频生成'}
                    </span>
                  </div>
                  <span className="text-xs text-white/60">{formatTime(item.timestamp)}</span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-white/80 mb-2 font-medium">学生：{item.studentName} ({item.studentId})</p>
                  <p className="text-sm text-white/60 line-clamp-2">{item.prompt}</p>
                </div>
                
                <div className="mb-4">
                  {item.type === 'text' ? (
                    <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 line-clamp-3">
                      {item.result}
                    </div>
                  ) : item.type === 'image' ? (
                    <div className="aspect-square bg-white/5 rounded-xl overflow-hidden">
                      <img 
                        src={item.result} 
                        alt="生成的图像" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-white/5 rounded-xl overflow-hidden">
                      <video 
                        className="w-full h-full object-cover"
                        poster={item.result}
                      >
                        <source src={item.result} type="video/mp4" />
                      </video>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(item.result, '_blank')}
                    className="flex-1 bg-white/20 hover:bg-white/30"
                  >
                    查看详情
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteHistory(item.id)}
                  >
                    删除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default History;
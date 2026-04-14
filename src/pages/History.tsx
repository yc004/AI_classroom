import React, { useState, useEffect } from 'react';

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

interface StudentGroup {
  studentId: string;
  studentName: string;
  items: HistoryItem[];
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

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
    return true;
  });

  // 按学生分组
  const groupedByStudent = filteredHistory.reduce((groups: Record<string, StudentGroup>, item) => {
    const key = item.studentId;
    if (!groups[key]) {
      groups[key] = {
        studentId: item.studentId,
        studentName: item.studentName,
        items: []
      };
    }
    groups[key].items.push(item);
    return groups;
  }, {});

  const studentGroups = Object.values(groupedByStudent);

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

  const toggleStudent = (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              📜 历史记录
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <a href="/config" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              配置管理
            </a>
            <a href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              返回首页
            </a>
          </div>
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="filterType" className="block text-sm font-semibold text-slate-700 mb-2">
                生成类型
              </label>
              <select
                id="filterType"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">全部</option>
                <option value="text">文本</option>
                <option value="image">图像</option>
                <option value="video">视频</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="filterStudent" className="block text-sm font-semibold text-slate-700 mb-2">
                学生筛选
              </label>
              <select
                id="filterStudent"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800"
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
              >
                <option value="all">全部学生</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-700">加载中...</p>
            </div>
          ) : studentGroups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">暂无历史记录</h3>
              <p className="text-slate-500">开始使用生成功能，记录会显示在这里</p>
            </div>
          ) : (
            studentGroups.map((group) => (
              <div key={group.studentId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* 学生信息卡片 */}
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleStudent(group.studentId)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {group.studentName} ({group.studentId})
                      </h3>
                      <p className="text-white/80 text-sm">
                        {group.items.length} 条记录 · 最后活动: {formatTime(group.items[0].timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-white">
                    <svg className={`w-5 h-5 transition-transform ${expandedStudent === group.studentId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* 展开的聊天记录 */}
                {expandedStudent === group.studentId && (
                  <div className="p-6 space-y-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{getTypeIcon(item.type)}</span>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${item.type === 'text' ? 'bg-blue-100 text-blue-700' : item.type === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                              {item.type === 'text' ? '文本生成' : item.type === 'image' ? '图像生成' : '视频生成'}
                            </span>
                            <span className="text-sm text-slate-500">{formatTime(item.timestamp)}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteHistory(item.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-all"
                          >
                            删除
                          </button>
                        </div>
                        
                        {/* 聊天记录样式 */}
                        <div className="space-y-4">
                          {/* 用户消息 */}
                          <div className="flex justify-end">
                            <div className="max-w-[80%] bg-blue-50 p-4 rounded-2xl rounded-tr-none border border-blue-100">
                              <p className="text-slate-800">{item.prompt}</p>
                            </div>
                          </div>
                          
                          {/* AI回复 */}
                          <div className="flex">
                            <div className="max-w-[80%] bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-200">
                              {item.type === 'text' ? (
                                <pre className="whitespace-pre-wrap text-slate-800 text-sm">{item.result}</pre>
                              ) : item.type === 'image' ? (
                                <img src={item.result} alt="生成的图像" className="max-w-full h-auto rounded-lg" />
                              ) : (
                                <video controls className="max-w-full h-auto rounded-lg">
                                  <source src={item.result} type="video/mp4" />
                                  您的浏览器不支持视频播放。
                                </video>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
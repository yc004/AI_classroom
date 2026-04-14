import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 学生数据存储路径
const studentsFilePath = path.join(__dirname, '../../data/students.json');

// 确保数据目录存在
const ensureDataDir = () => {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(studentsFilePath)) {
    fs.writeFileSync(studentsFilePath, JSON.stringify([]));
  }
};

// 获取学生列表
const getStudents = (): any[] => {
  ensureDataDir();
  const data = fs.readFileSync(studentsFilePath, 'utf8');
  return JSON.parse(data);
};

// 学生登录验证
router.post('/login', (req, res) => {
  const { studentId, name } = req.body;
  
  if (!studentId || !name) {
    return res.json({ success: false, error: '请输入学号和姓名' });
  }
  
  const students = getStudents();
  const student = students.find((s: any) => s.studentId === studentId && s.name === name);
  
  if (student) {
    // 生成简单的token
    const token = Buffer.from(`${studentId}:${name}`).toString('base64');
    res.json({ success: true, token, studentId, name });
  } else {
    res.json({ success: false, error: '学号或姓名错误' });
  }
});

// 获取学生名单
router.get('/students', (req, res) => {
  const students = getStudents();
  res.json({ success: true, data: students });
});

// 添加学生
router.post('/students', (req, res) => {
  const { studentId, name } = req.body;
  
  if (!studentId || !name) {
    return res.json({ success: false, error: '请输入学号和姓名' });
  }
  
  const students = getStudents();
  const existingStudent = students.find((s: any) => s.studentId === studentId);
  
  if (existingStudent) {
    return res.json({ success: false, error: '学号已存在' });
  }
  
  const newStudent = {
    id: Date.now().toString(),
    studentId,
    name,
    createdAt: Date.now()
  };
  
  students.push(newStudent);
  fs.writeFileSync(studentsFilePath, JSON.stringify(students, null, 2));
  res.json({ success: true });
});

// 更新学生
router.put('/students', (req, res) => {
  const { id, studentId, name } = req.body;
  
  if (!id || !studentId || !name) {
    return res.json({ success: false, error: '请输入完整信息' });
  }
  
  const students = getStudents();
  const index = students.findIndex((s: any) => s.id === id);
  
  if (index === -1) {
    return res.json({ success: false, error: '学生不存在' });
  }
  
  // 检查学号是否被其他学生使用
  const existingStudent = students.find((s: any) => s.studentId === studentId && s.id !== id);
  if (existingStudent) {
    return res.json({ success: false, error: '学号已被其他学生使用' });
  }
  
  students[index] = {
    ...students[index],
    studentId,
    name
  };
  
  fs.writeFileSync(studentsFilePath, JSON.stringify(students, null, 2));
  res.json({ success: true });
});

// 删除学生
router.delete('/students', (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.json({ success: false, error: '请输入学生ID' });
  }
  
  const students = getStudents();
  const filteredStudents = students.filter((s: any) => s.id !== id);
  
  if (filteredStudents.length === students.length) {
    return res.json({ success: false, error: '学生不存在' });
  }
  
  fs.writeFileSync(studentsFilePath, JSON.stringify(filteredStudents, null, 2));
  res.json({ success: true });
});

export default router;
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

const normalizeText = (value: unknown): string => String(value ?? '').trim();

const parseStudentLine = (line: string): { studentId: string; name: string } | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const byDelimiter = trimmed.split(/[,\t，]+/).map((part) => part.trim()).filter(Boolean);
  if (byDelimiter.length >= 2) {
    return {
      studentId: byDelimiter[0],
      name: byDelimiter.slice(1).join(' ')
    };
  }

  const bySpace = trimmed.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  if (bySpace.length >= 2) {
    return {
      studentId: bySpace[0],
      name: bySpace.slice(1).join(' ')
    };
  }

  return null;
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
  const studentId = normalizeText(req.body?.studentId);
  const name = normalizeText(req.body?.name);
  
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

// 批量导入学生（支持每行：学号,姓名 / 学号 姓名 / 学号<TAB>姓名）
router.post('/students/batch-import', (req, res) => {
  const rawText = normalizeText(req.body?.data);

  if (!rawText) {
    return res.json({ success: false, error: '请输入要导入的学生数据' });
  }

  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return res.json({ success: false, error: '未检测到有效数据行' });
  }

  const students = getStudents();
  const existingIds = new Set(students.map((s: any) => String(s.studentId)));
  const pendingIds = new Set<string>();
  const newStudents: any[] = [];
  const invalidLines: string[] = [];
  const duplicatedIds: string[] = [];

  lines.forEach((line) => {
    const parsed = parseStudentLine(line);
    if (!parsed) {
      invalidLines.push(line);
      return;
    }

    const studentId = normalizeText(parsed.studentId);
    const name = normalizeText(parsed.name);

    if (!studentId || !name) {
      invalidLines.push(line);
      return;
    }

    if (existingIds.has(studentId) || pendingIds.has(studentId)) {
      duplicatedIds.push(studentId);
      return;
    }

    pendingIds.add(studentId);
    newStudents.push({
      id: `${Date.now()}-${studentId}-${Math.random().toString(36).slice(2, 8)}`,
      studentId,
      name,
      createdAt: Date.now()
    });
  });

  if (newStudents.length > 0) {
    fs.writeFileSync(studentsFilePath, JSON.stringify([...students, ...newStudents], null, 2));
  }

  res.json({
    success: true,
    data: {
      total: lines.length,
      added: newStudents.length,
      duplicated: duplicatedIds.length,
      invalid: invalidLines.length,
      invalidLines: invalidLines.slice(0, 5),
      duplicatedIds: Array.from(new Set(duplicatedIds)).slice(0, 10)
    }
  });
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

// 批量删除学生
router.post('/students/batch-delete', (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((id: unknown) => normalizeText(id)).filter(Boolean)
    : [];

  if (ids.length === 0) {
    return res.json({ success: false, error: '请至少选择一名学生' });
  }

  const students = getStudents();
  const idSet = new Set(ids);
  const filteredStudents = students.filter((s: any) => !idSet.has(String(s.id)));
  const deleted = students.length - filteredStudents.length;

  if (deleted === 0) {
    return res.json({ success: false, error: '未找到可删除的学生' });
  }

  fs.writeFileSync(studentsFilePath, JSON.stringify(filteredStudents, null, 2));
  res.json({
    success: true,
    data: {
      requested: ids.length,
      deleted
    }
  });
});

export default router;

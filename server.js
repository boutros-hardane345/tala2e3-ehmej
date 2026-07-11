import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase } from './lib/db.js';
import { requireAuth, authenticateAdmin } from './lib/auth.js';
import Member from './models/Member.js';
import Meeting from './models/Meeting.js';
import Event from './models/Event.js';
import MonthlyActivity from './models/MonthlyActivity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
import { mkdirSync, existsSync } from 'fs';
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use('/uploads', express.static(uploadsDir));

// ----- Auth -----
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.' });
    }
    const token = await authenticateAdmin(username, password);
    if (!token) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
    }
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
});

// ----- Members (public read, admin write) -----
app.get('/api/members', async (req, res) => {
  await connectToDatabase();
  const members = await Member.find().sort({ createdAt: 1 }).lean();
  res.json(members);
});

app.get('/api/members/:id', async (req, res) => {
  await connectToDatabase();
  const member = await Member.findById(req.params.id).lean();
  if (!member) return res.status(404).json({ error: 'العضو غير موجود.' });
  res.json(member);
});

app.post('/api/members', requireAuth, async (req, res) => {
  await connectToDatabase();
  const { fullName, dob, bloodType, role, promise, knights, costume, commitment, working } = req.body;
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'الاسم الكامل مطلوب.' });
  }
  let age = '';
  if (dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    if (!isNaN(birthDate.getTime())) {
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    }
  }
  const member = await Member.create({
    fullName: fullName.trim(),
    dob: dob || '',
    age: age >= 0 ? age : '',
    bloodType: bloodType || 'غير معروف',
    role: role || 'عضو',
    promise: promise || 'نعم',
    knights: promise === 'نعم' ? (knights || 'لا') : 'لا',
    costume: costume || 'نعم',
    commitment: commitment || 'عالٍ',
    working: working || 'نعم',
  });
  res.status(201).json(member);
});

app.put('/api/members/:id', requireAuth, async (req, res) => {
  await connectToDatabase();
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ error: 'العضو غير موجود.' });

  const { fullName, dob, bloodType, role, promise, knights, costume, commitment, working } = req.body;

  if (fullName !== undefined) {
    if (!fullName.trim()) return res.status(400).json({ error: 'الاسم الكامل مطلوب.' });
    member.fullName = fullName.trim();
  }
  if (dob !== undefined) {
    member.dob = dob;
    let age = '';
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      }
    }
    member.age = age >= 0 ? age : '';
  }
  if (bloodType !== undefined) member.bloodType = bloodType;
  if (role !== undefined) member.role = role;
  if (promise !== undefined) {
    member.promise = promise;
    if (promise !== 'نعم') member.knights = 'لا';
  }
  if (knights !== undefined && member.promise === 'نعم') member.knights = knights;
  if (costume !== undefined) member.costume = costume;
  if (commitment !== undefined) member.commitment = commitment;
  if (working !== undefined) member.working = working;

  await member.save();
  res.json(member.toObject());
});

app.delete('/api/members/:id', requireAuth, async (req, res) => {
  await connectToDatabase();
  const member = await Member.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ error: 'العضو غير موجود.' });
  res.json({ message: 'تم حذف العضو بنجاح.' });
});

// ----- Member Photo Upload -----
app.post('/api/members/upload-photo', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'الرجاء اختيار صورة.' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ----- Meetings (admin only) -----
app.get('/api/meetings', requireAuth, async (req, res) => {
  await connectToDatabase();
  const meetings = await Meeting.find().sort({ createdAt: -1 }).populate('attendance.member', 'fullName').lean();
  res.json(meetings);
});

app.post('/api/meetings', requireAuth, async (req, res) => {
  await connectToDatabase();
  const { title, date, attendance } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'عنوان اللقاء مطلوب.' });
  }
  const meeting = await Meeting.create({
    title: title.trim(),
    date: date || '',
    attendance: attendance || [],
  });
  const populated = await Meeting.populate(meeting, { path: 'attendance.member', select: 'fullName' });
  res.status(201).json(populated);
});

app.get('/api/meetings/:id', requireAuth, async (req, res) => {
  await connectToDatabase();
  const meeting = await Meeting.findById(req.params.id).populate('attendance.member', 'fullName').lean();
  if (!meeting) return res.status(404).json({ error: 'اللقاء غير موجود.' });
  res.json(meeting);
});

app.put('/api/meetings/:id', requireAuth, async (req, res) => {
  await connectToDatabase();
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'اللقاء غير موجود.' });

  const { title, date, attendance } = req.body;
  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'عنوان اللقاء مطلوب.' });
    meeting.title = title.trim();
  }
  if (date !== undefined) meeting.date = date;
  if (attendance !== undefined) meeting.attendance = attendance;

  await meeting.save();
  const populated = await Meeting.populate(meeting, { path: 'attendance.member', select: 'fullName' });
  res.json(populated);
});

app.delete('/api/meetings/:id', requireAuth, async (req, res) => {
  await connectToDatabase();
  const meeting = await Meeting.findByIdAndDelete(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'اللقاء غير موجود.' });
  res.json({ message: 'تم حذف اللقاء بنجاح.' });
});

// ----- Events (public read, admin write) -----
app.get('/api/events', async (req, res) => {
  await connectToDatabase();
  const { type } = req.query;
  const filter = type ? { type } : {};
  const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
  res.json(events);
});

app.get('/api/events/upcoming', async (req, res) => {
  await connectToDatabase();
  const events = await Event.find({ type: 'upcoming' }).sort({ date: 1 }).lean();
  res.json(events);
});

function calcEventType(dateStr) {
  if (!dateStr) return 'upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDate = new Date(dateStr + 'T00:00:00');
  if (isNaN(evDate.getTime())) return 'upcoming';
  return evDate < today ? 'past_activity' : 'upcoming';
}

app.post('/api/events', requireAuth, upload.single('image'), async (req, res) => {
  await connectToDatabase();
  const { title, description, date, time, month, year } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'عنوان النشاط مطلوب.' });
  }
  let imageUrl = req.body.imageUrl || '';
  if (req.file) {
    imageUrl = '/uploads/' + req.file.filename;
  }
  const event = await Event.create({
    title: title.trim(),
    description: description || '',
    date: date || '',
    time: time || '',
    type: calcEventType(date),
    imageUrl: imageUrl,
    month: month || '',
    year: year || '',
  });
  res.status(201).json(event);
});

app.get('/api/events/:id', async (req, res) => {
  await connectToDatabase();
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ error: 'النشاط غير موجود.' });
  res.json(event);
});

app.put('/api/events/:id', requireAuth, upload.single('image'), async (req, res) => {
  await connectToDatabase();
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ error: 'النشاط غير موجود.' });

  const { title, description, date, time, imageUrl, month, year } = req.body;
  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'عنوان النشاط مطلوب.' });
    event.title = title.trim();
  }
  if (description !== undefined) event.description = description;
  if (date !== undefined) {
    event.date = date;
    event.type = calcEventType(date);
  }
  if (time !== undefined) event.time = time;
  if (req.file) {
    event.imageUrl = '/uploads/' + req.file.filename;
  } else if (imageUrl !== undefined) {
    event.imageUrl = imageUrl;
  }
  if (month !== undefined) event.month = month;
  if (year !== undefined) event.year = year;

  await event.save();
  res.json(event.toObject());
});

app.delete('/api/events/:id', requireAuth, async (req, res) => {
  await connectToDatabase();
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ error: 'النشاط غير موجود.' });
  res.json({ message: 'تم حذف النشاط بنجاح.' });
});

// ----- Monthly Activities (public read, admin write) -----
app.get('/api/monthly-activities', async (req, res) => {
  await connectToDatabase();
  const activities = await MonthlyActivity.find().sort({ year: 1, month: 1 }).lean();
  res.json(activities);
});

app.post('/api/monthly-activities', requireAuth, upload.fields([
  { name: 'scheduleImage', maxCount: 1 },
  { name: 'meetingPhotos', maxCount: 50 },
]), async (req, res) => {
  await connectToDatabase();
  const { year, month, monthName, meetings } = req.body;
  if (!year || !month) return res.status(400).json({ error: 'السنة والشهر مطلوبان.' });

  let scheduleImage = '';
  if (req.files && req.files.scheduleImage && req.files.scheduleImage[0]) {
    scheduleImage = '/uploads/' + req.files.scheduleImage[0].filename;
  }

  let parsedMeetings = [];
  try { parsedMeetings = meetings ? JSON.parse(meetings) : []; } catch (e) { parsedMeetings = []; }

  if (req.files && req.files.meetingPhotos) {
    req.files.meetingPhotos.forEach((file, idx) => {
      if (parsedMeetings[idx]) parsedMeetings[idx].photo = '/uploads/' + file.filename;
    });
  }

  const existing = await MonthlyActivity.findOne({ year, month });
  if (existing) {
    if (scheduleImage) existing.scheduleImage = scheduleImage;
    if (parsedMeetings.length > 0) existing.meetings = parsedMeetings;
    await existing.save();
    return res.json(existing.toObject());
  }

  const activity = await MonthlyActivity.create({
    year, month, monthName: monthName || '',
    scheduleImage,
    meetings: parsedMeetings,
  });
  res.status(201).json(activity.toObject());
});

app.put('/api/monthly-activities/:id', requireAuth, upload.fields([
  { name: 'scheduleImage', maxCount: 1 },
  { name: 'meetingPhotos', maxCount: 50 },
]), async (req, res) => {
  await connectToDatabase();
  const activity = await MonthlyActivity.findById(req.params.id);
  if (!activity) return res.status(404).json({ error: 'غير موجود.' });

  const { year, month, monthName, meetings } = req.body;
  if (year !== undefined) activity.year = year;
  if (month !== undefined) activity.month = month;
  if (monthName !== undefined) activity.monthName = monthName;

  if (req.files && req.files.scheduleImage && req.files.scheduleImage[0]) {
    activity.scheduleImage = '/uploads/' + req.files.scheduleImage[0].filename;
  }

  if (meetings !== undefined) {
    try { activity.meetings = JSON.parse(meetings); } catch (e) {}
    if (req.files && req.files.meetingPhotos) {
      req.files.meetingPhotos.forEach((file, idx) => {
        if (activity.meetings[idx]) activity.meetings[idx].photo = '/uploads/' + file.filename;
      });
    }
  }

  await activity.save();
  res.json(activity.toObject());
});

app.delete('/api/monthly-activities/:id', requireAuth, async (req, res) => {
  await connectToDatabase();
  const activity = await MonthlyActivity.findByIdAndDelete(req.params.id);
  if (!activity) return res.status(404).json({ error: 'غير موجود.' });
  res.json({ message: 'تم الحذف.' });
});

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});

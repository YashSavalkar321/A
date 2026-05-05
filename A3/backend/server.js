require('dotenv').config();
const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');
const app = express();

app.use(cors());
app.use(express.json());

// Public route
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/export',    auth, require('./routes/export'));
app.use('/api/classroom',  auth, require('./routes/classroom'));
app.use('/api/department', auth, require('./routes/department'));
app.use('/api/course',     auth, require('./routes/course'));
app.use('/api/instructor', auth, require('./routes/instructor'));
app.use('/api/student',    auth, require('./routes/student'));
app.use('/api/section',    auth, require('./routes/section'));
app.use('/api/teaches',    auth, require('./routes/teaches'));
app.use('/api/takes',      auth, require('./routes/takes'));
app.use('/api/advisor',    auth, require('./routes/advisor'));
app.use('/api/timeslot',   auth, require('./routes/timeslot'));
app.use('/api/prereq',     auth, require('./routes/prereq'));
app.use('/api/report',     auth, require('./routes/report'));
app.use('/api/role',       auth, require('./routes/role'));

app.get('/', (req, res) => res.json({ message: 'University MIS API running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

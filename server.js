const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'db.json');
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET || 'stor_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

function readDB(){
  if(!fs.existsSync(DATA_FILE)){
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], products: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeDB(db){
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Ensure default admin exists
(function ensureAdmin(){
  const db = readDB();
  if(!db.users.find(u=>u.username==='admin')){
    db.users.push({ id: 1, username: 'admin', password: 'admin123', role: 'admin' });
    writeDB(db);
    console.log('Seeded admin: admin / admin123');
  }
})();

// Auth routes
app.post('/api/register', (req,res)=>{
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ message: 'Missing fields' });
  const db = readDB();
  if(db.users.find(u=>u.username===username)) return res.status(400).json({ message: 'User exists' });
  const id = Date.now();
  db.users.push({ id, username, password, role: 'user' });
  writeDB(db);
  req.session.user = { id, username, role: 'user' };
  res.json({ message: 'Registered', user: req.session.user });
});

app.post('/api/login', (req,res)=>{
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u=>u.username===username && u.password===password);
  if(!user) return res.status(401).json({ message: 'Invalid credentials' });
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json({ message: 'Logged in', user: req.session.user });
});

app.post('/api/logout', (req,res)=>{
  req.session.destroy(()=> res.json({ message: 'Logged out' }));
});

app.get('/api/me', (req,res)=>{
  res.json({ user: req.session.user || null });
});

// Middleware
function requireAuth(req,res,next){
  if(!req.session.user) return res.status(401).json({ message: 'Login required' });
  next();
}
function requireAdmin(req,res,next){
  if(!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ message: 'You must be admin to manage products' });
  next();
}

// Products endpoints
app.get('/api/products', (req,res)=>{
  const db = readDB();
  res.json(db.products || []);
});

app.post('/api/products', requireAdmin, (req,res)=>{
  const { name, price, category, image } = req.body;
  if(!name || !price) return res.status(400).json({ message: 'Missing name or price' });
  const db = readDB();
  const product = { id: Date.now(), name, price: Number(price), category: category||'General', image: image||'' };
  db.products.push(product);
  writeDB(db);
  res.json({ message: 'Product added', product });
});

// Serve admin page only to admin (protect at server level)
app.get('/admin', (req,res)=>{
  if(!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start
app.listen(PORT, ()=> console.log('Server listening on port', PORT));

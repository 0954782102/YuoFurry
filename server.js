// Simple Express server to serve static files and save users.json
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'users.json');

app.use(express.json());
app.use('/', express.static(path.join(__dirname, '/')));
app.use('/app', express.static(path.join(__dirname, 'app')));

// read users
function readUsers(){
  try { return JSON.parse(fs.readFileSync(DATA,'utf8')||'[]'); }
  catch(e){ return []; }
}

// write users
function writeUsers(arr){
  fs.writeFileSync(DATA, JSON.stringify(arr, null, 2), 'utf8');
}

app.get('/api/users', (req, res) => {
  res.json(readUsers());
});

app.post('/api/users', (req, res) => {
  const u = req.body;
  if (!u || !u.email) return res.status(400).json({error:'invalid'});
  const users = readUsers();
  users.push(u);
  writeUsers(users);
  res.json({ok:true});
});

app.listen(PORT, ()=> console.log(`Server listening on http://localhost:${PORT}`));

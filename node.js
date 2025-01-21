const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
// const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// app.use(cors());
app.use(bodyParser.json());

// app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'frontend.html'));
});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'swetha@123', 
    database: 'todo_list'
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection failed:', err);
        return;
    }
    console.log('MySQL connected...');
});

function formatDate(date) {

    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}

app.get('/tasks', (req, res) => {
    const query = 'SELECT * FROM tasks WHERE deleted = 0'; 
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).send('Error fetching tasks');
        }

        const tasks = results.map(task => ({
            ...task,
            due_date: formatDate(task.due_date), 
            createdAt: formatDate(task.created_at) 
        }));

        res.json(tasks);
    });
});

app.post('/tasks', (req, res) => {
    const { title, description, due_date, status, createdAt } = req.body; 

    if (!title || !due_date || !createdAt) { 
        return res.status(400).send('Title, due date, and created date are required');
    }

    const query = 'INSERT INTO tasks (title, description, due_date, status, created_at) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [title, description, due_date, status, createdAt], (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            return res.status(500).send('Error adding task');
        }

        res.status(200).json({ id: result.insertId, title, description, due_date, status, createdAt }); 
    });
});

app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, status, deleted } = req.body;

  if (deleted !== undefined) {
      const query = 'UPDATE tasks SET deleted = ? WHERE id = ?';
      db.query(query, [deleted, id], (err, result) => {
          if (err){
              console.error('Error updating task:', err);
              return res.status(500).send('Error updating task');
          }

          if (result.affectedRows === 0) {
              return res.status(400).send('Task not found');
          }

          return res.json({ id, deleted });
      });
  } else {
      if (!title || !due_date) {
          return res.status(400).send('Title and due date are required');
      }

      const query = 'UPDATE tasks SET title = ?, description = ?, due_date = ?, status = ? WHERE id = ?'; 
      db.query(query, [title, description, due_date, status, id], (err, result) => {
          if (err) {
              console.error('Error updating task:', err);
              return res.status(500).send('Error updating task');
          }

          if (result.affectedRows === 0) {
              return res.status(400).send('Task not found');
          }

          res.json({ id, title, description, due_date, status }); 
      });
  }
});

app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).send('Error deleting task');
        }

        if (result.affectedRows === 0) {
            return res.status(400).send('Task not found');
        }

        res.status(200).send();
    });
});

app.get('/tasks/trash', (req, res) => {
    const query = 'SELECT * FROM tasks WHERE deleted = 1';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching deleted tasks:', err);
            return res.status(500).send('Error fetching deleted tasks');
        }

        const tasks = results.map(task => ({
            ...task,
            due_date: formatDate(task.due_date),
            createdAt: formatDate(task.createdAt)
        }));

        res.json(tasks);
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

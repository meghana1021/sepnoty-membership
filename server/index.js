import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Forms table
  db.run(`
    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      fields TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Responses table
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      submitter_name TEXT,
      submitter_email TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
    )
  `);
});

// Helper functions
const handleError = (res, error, message = 'Internal server error') => {
  console.error(error);
  res.status(500).json({ error: message });
};

// Routes

// Get all forms
app.get('/api/forms', (req, res) => {
  db.all('SELECT * FROM forms ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return handleError(res, err, 'Failed to fetch forms');
    }
    
    const forms = rows.map(row => ({
      ...row,
      fields: JSON.parse(row.fields),
      createdAt: row.created_at
    }));
    
    res.json(forms);
  });
});

// Get single form
app.get('/api/forms/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM forms WHERE id = ?', [id], (err, row) => {
    if (err) {
      return handleError(res, err, 'Failed to fetch form');
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const form = {
      ...row,
      fields: JSON.parse(row.fields),
      createdAt: row.created_at
    };
    
    res.json(form);
  });
});

// Create form
app.post('/api/forms', (req, res) => {
  const { title, description, fields } = req.body;
  
  if (!title || !fields || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'Title and fields are required' });
  }
  
  const id = uuidv4();
  const fieldsJson = JSON.stringify(fields);
  
  db.run(
    'INSERT INTO forms (id, title, description, fields) VALUES (?, ?, ?, ?)',
    [id, title, description || '', fieldsJson],
    function(err) {
      if (err) {
        return handleError(res, err, 'Failed to create form');
      }
      
      res.status(201).json({
        id,
        title,
        description: description || '',
        fields,
        createdAt: new Date().toISOString()
      });
    }
  );
});

// Update form
app.put('/api/forms/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, fields } = req.body;
  
  if (!title || !fields || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'Title and fields are required' });
  }
  
  const fieldsJson = JSON.stringify(fields);
  
  db.run(
    'UPDATE forms SET title = ?, description = ?, fields = ? WHERE id = ?',
    [title, description || '', fieldsJson, id],
    function(err) {
      if (err) {
        return handleError(res, err, 'Failed to update form');
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Form not found' });
      }
      
      res.json({
        id,
        title,
        description: description || '',
        fields
      });
    }
  );
});

// Delete form
app.delete('/api/forms/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM forms WHERE id = ?', [id], function(err) {
    if (err) {
      return handleError(res, err, 'Failed to delete form');
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json({ message: 'Form deleted successfully' });
  });
});

// Get responses for a form
app.get('/api/forms/:id/responses', (req, res) => {
  const { id } = req.params;
  
  db.all(
    'SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC',
    [id],
    (err, rows) => {
      if (err) {
        return handleError(res, err, 'Failed to fetch responses');
      }
      
      const responses = rows.map(row => ({
        id: row.id,
        formId: row.form_id,
        answers: JSON.parse(row.answers),
        submitterName: row.submitter_name,
        submitterEmail: row.submitter_email,
        submittedAt: row.submitted_at
      }));
      
      res.json(responses);
    }
  );
});

// Get all responses
app.get('/api/responses', (req, res) => {
  const query = `
    SELECT r.*, f.title as form_title 
    FROM responses r 
    JOIN forms f ON r.form_id = f.id 
    ORDER BY r.submitted_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return handleError(res, err, 'Failed to fetch responses');
    }
    
    const responses = rows.map(row => ({
      id: row.id,
      formId: row.form_id,
      formTitle: row.form_title,
      answers: JSON.parse(row.answers),
      submitterName: row.submitter_name,
      submitterEmail: row.submitter_email,
      submittedAt: row.submitted_at
    }));
    
    res.json(responses);
  });
});

// Submit response
app.post('/api/forms/:id/responses', (req, res) => {
  const { id: formId } = req.params;
  const { answers, submitterName, submitterEmail } = req.body;
  
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Answers are required' });
  }
  
  // First check if form exists
  db.get('SELECT id FROM forms WHERE id = ?', [formId], (err, row) => {
    if (err) {
      return handleError(res, err, 'Failed to verify form');
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const responseId = uuidv4();
    const answersJson = JSON.stringify(answers);
    
    db.run(
      'INSERT INTO responses (id, form_id, answers, submitter_name, submitter_email) VALUES (?, ?, ?, ?, ?)',
      [responseId, formId, answersJson, submitterName || null, submitterEmail || null],
      function(err) {
        if (err) {
          return handleError(res, err, 'Failed to submit response');
        }
        
        res.status(201).json({
          id: responseId,
          formId,
          answers,
          submitterName,
          submitterEmail,
          submittedAt: new Date().toISOString()
        });
      }
    );
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const queries = {
    totalForms: 'SELECT COUNT(*) as count FROM forms',
    totalResponses: 'SELECT COUNT(*) as count FROM responses',
    recentResponses: `
      SELECT r.*, f.title as form_title 
      FROM responses r 
      JOIN forms f ON r.form_id = f.id 
      ORDER BY r.submitted_at DESC 
      LIMIT 5
    `
  };
  
  let stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  const checkComplete = () => {
    completed++;
    if (completed === total) {
      stats.avgResponsesPerForm = stats.totalForms > 0 
        ? (stats.totalResponses / stats.totalForms).toFixed(1) 
        : '0';
      res.json(stats);
    }
  };
  
  // Get total forms
  db.get(queries.totalForms, (err, row) => {
    if (err) return handleError(res, err);
    stats.totalForms = row.count;
    checkComplete();
  });
  
  // Get total responses
  db.get(queries.totalResponses, (err, row) => {
    if (err) return handleError(res, err);
    stats.totalResponses = row.count;
    checkComplete();
  });
  
  // Get recent responses
  db.all(queries.recentResponses, (err, rows) => {
    if (err) return handleError(res, err);
    stats.recentResponses = rows.map(row => ({
      id: row.id,
      formId: row.form_id,
      formTitle: row.form_title,
      answers: JSON.parse(row.answers),
      submitterName: row.submitter_name,
      submitterEmail: row.submitter_email,
      submittedAt: row.submitted_at
    }));
    checkComplete();
  });
});

// Export responses
app.get('/api/forms/:id/export', (req, res) => {
  const { id } = req.params;
  
  // Get form and responses
  const formQuery = 'SELECT * FROM forms WHERE id = ?';
  const responsesQuery = 'SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC';
  
  db.get(formQuery, [id], (err, form) => {
    if (err) return handleError(res, err);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    
    db.all(responsesQuery, [id], (err, responses) => {
      if (err) return handleError(res, err);
      
      const formData = JSON.parse(form.fields);
      const headers = ['Submitted At', 'Name', 'Email', ...formData.map(f => f.label)];
      
      const rows = responses.map(response => {
        const answers = JSON.parse(response.answers);
        return [
          new Date(response.submitted_at).toLocaleString(),
          response.submitter_name || '',
          response.submitter_email || '',
          ...formData.map(field => {
            const answer = answers[field.id];
            if (Array.isArray(answer)) {
              return answer.join(', ');
            }
            return answer || '';
          })
        ];
      });
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${form.title}_responses.csv"`);
      res.send(csvContent);
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sepnoty Club Forms Backend running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});
// Fix session status and completed field inconsistencies
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prepmate.sqlite');
const userEmail = 'oshoup521@gmail.com';

console.log(`Fixing session data for user: ${userEmail}`);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to database`);
});

// Get user first
db.get(`SELECT * FROM user WHERE email = ?`, [userEmail], (err, user) => {
  if (err) {
    console.error(`Error finding user: ${err.message}`);
    db.close();
    return;
  }
  
  if (!user) {
    console.log(`No user found with email: ${userEmail}`);
    db.close();
    return;
  }
  
  console.log(`Found user: ${user.name} (${user.id})`);
  
  // Get all sessions for this user
  db.all(`SELECT * FROM interview_session WHERE userId = ?`, [user.id], (err, sessions) => {
    if (err) {
      console.error(`Error querying sessions: ${err.message}`);
      db.close();
      return;
    }
    
    console.log(`\nFound ${sessions.length} sessions to fix:\n`);
    
    let fixCount = 0;
    let processedCount = 0;
    
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}: ${session.id}`);
      console.log(`  Current: completed=${session.completed}, status='${session.status}'`);
      
      let newStatus = session.status;
      let newCompleted = session.completed;
      let needsUpdate = false;
      
      // Parse questions and answers to determine actual state
      let questionCount = 0;
      let answerCount = 0;
      
      try {
        if (session.questions) {
          const questions = JSON.parse(session.questions);
          questionCount = Array.isArray(questions) ? questions.length : 0;
        }
        if (session.answers) {
          const answers = JSON.parse(session.answers);
          answerCount = Array.isArray(answers) ? answers.length : 0;
        }
      } catch (e) {
        console.log(`  Warning: Invalid JSON in questions/answers`);
      }
      
      // Determine correct status based on data
      if (session.summary || (questionCount > 0 && answerCount > 0)) {
        // Has summary or Q&A data - should be completed
        newStatus = 'completed';
        newCompleted = 1;
      } else if (questionCount > 0) {
        // Has questions but no answers - in progress
        newStatus = 'in_progress';
        newCompleted = 0;
      } else {
        // No questions or answers - active (newly created)
        newStatus = 'active';
        newCompleted = 0;
      }
      
      // Check if update is needed
      if (newStatus !== session.status || newCompleted !== session.completed) {
        needsUpdate = true;
        console.log(`  Fix to: completed=${newCompleted}, status='${newStatus}'`);
        
        db.run(
          `UPDATE interview_session SET status = ?, completed = ? WHERE id = ?`,
          [newStatus, newCompleted, session.id],
          function(err) {
            processedCount++;
            if (err) {
              console.error(`  Error updating session ${session.id}: ${err.message}`);
            } else {
              fixCount++;
              console.log(`  ✓ Fixed session ${session.id}`);
            }
            
            // Check if all sessions processed
            if (processedCount === sessions.length) {
              console.log(`\n=== Summary ===`);
              console.log(`Fixed ${fixCount} out of ${sessions.length} sessions`);
              db.close();
            }
          }
        );
      } else {
        processedCount++;
        console.log(`  ✓ Already correct`);
        
        // Check if all sessions processed
        if (processedCount === sessions.length) {
          console.log(`\n=== Summary ===`);
          console.log(`Fixed ${fixCount} out of ${sessions.length} sessions`);
          db.close();
        }
      }
    });
    
    // Handle case where no sessions need updating
    if (sessions.length === 0) {
      console.log('No sessions found to process');
      db.close();
    }
  });
});

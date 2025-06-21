require('module-alias/register');
console.log("got module-alias")
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

// Ensure running on Node.js version 20 or higher
const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  console.log('Please upgrade your node.js version to 20 or greater. 👌\n');
  process.exit();
}

// Load environment variables from .env and .env.local (if exists)
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Verify that the DATABASE environment variable is set
if (!process.env.DATABASE) {
  console.error('ERROR: Missing DATABASE environment variable.');
  process.exit(1);
}

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.DATABASE)
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch(err => {
    console.error('🔥 MongoDB connection error:', err);
    process.exit(1);
  });

// Optional: Store OpenAI API key if needed elsewhere
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Log MongoDB connection errors with helpful message
mongoose.connection.on('error', (error) => {
  console.log('🔥 Common error: Check your .env file and MongoDB URL');
  console.error(`🚫 Error: ${error.message}`);
});

// Dynamically load all model files to register Mongoose schemas
const modelsFiles = globSync('./src/models/**/*.js');
for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

// Load Express app
const app = require('./app');

// Set port from environment or default to 8888
app.set('port', process.env.PORT || 8888);

// Start HTTP server
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → On PORT : ${server.address().port}`);
});

// Graceful shutdown handling on process termination (Ctrl+C)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

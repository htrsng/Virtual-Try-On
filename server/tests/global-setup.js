module.exports = () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = '';
  process.env.JWT_SECRET = 'qa-only-disposable-signing-secret-never-deploy';
  process.env.GEMINI_API_KEY = '';
  process.env.EMAIL_USER = '';
  process.env.EMAIL_PASS = '';
};

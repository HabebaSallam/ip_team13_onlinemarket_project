// Validation middleware
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validate = (req, res, next) => {
  const errors = [];

  if (req.path === '/register' && req.method === 'POST') {
    const { name, email, password } = req.body;

    if (!name || name.trim() === '') {
      errors.push('Name is required');
    }

    if (!email || !validateEmail(email)) {
      errors.push('Valid email is required');
    }

    if (!password || !validatePassword(password)) {
      errors.push('Password must be at least 6 characters');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = validate;

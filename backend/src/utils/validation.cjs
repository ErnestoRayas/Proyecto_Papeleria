const text = (value, max = 100) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = password => typeof password === 'string' && password.length >= 10 && password.length <= 128;
module.exports = { text, validEmail, validPassword };

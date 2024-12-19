const bcrypt = require('bcrypt');

// Number of salt rounds (adjust as needed, higher values are more secure but slower)
const saltRounds = 10;

// Generate a random secret key
bcrypt.genSalt(saltRounds, (err, salt) => {
  if (err) throw err;

  console.log('Generated secret key:');
  console.log(salt);
});
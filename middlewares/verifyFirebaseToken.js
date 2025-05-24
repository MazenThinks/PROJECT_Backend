const admin = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authorization header missing or invalid');
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Verifying Firebase token:', token);
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Firebase token decoded:', decodedToken);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    res.status(401).json({ message: 'Firebase token verification failed', error: error.message });
  }
};

module.exports = verifyFirebaseToken;

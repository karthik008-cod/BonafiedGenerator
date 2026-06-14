export default function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  // Credentials stored ONLY as Vercel environment variables — never in HTML
  const validUser = process.env.APP_USERNAME;
  const validPass = process.env.APP_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!validUser || !validPass || !sessionSecret) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  if (username === validUser && password === validPass) {
    // Return the session token only on successful login
    return res.status(200).json({ success: true, token: sessionSecret });
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password.' });
}

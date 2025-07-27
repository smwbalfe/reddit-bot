# Reddit OAuth Test App

A standalone test application to experiment with Reddit OAuth authentication using PRAW.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Register a Reddit app:
   - Go to https://www.reddit.com/prefs/apps/
   - Click "Create App" or "Create Another App"
   - Choose "web app" 
   - Set redirect URI to: `http://localhost:8080`
   - Note down your client ID and client secret

3. Update the script:
   - Replace `YOUR_CLIENT_ID` with your app's client ID
   - Replace `YOUR_CLIENT_SECRET` with your app's client secret
   - Replace `your_username` with your Reddit username

## Usage

Run the test script:
```bash
python test_oauth.py
```

The script offers three testing modes:

1. **OAuth Code Flow**: Complete first-time OAuth setup
2. **Saved Refresh Token**: Test with a previously obtained refresh token
3. **Read-Only Access**: Test public Reddit access without authentication

## OAuth Flow Types

- **Password Flow**: Direct username/password (for script apps)
- **Code Flow**: Web-based authorization (for web/installed apps)
- **Implicit Flow**: Direct token in redirect (less secure)
- **Application-Only**: Read-only access without user context

## Security Notes

- Never commit client secrets to version control
- Use environment variables or config files for credentials
- Refresh tokens should be stored securely
- Consider token expiration and renewal
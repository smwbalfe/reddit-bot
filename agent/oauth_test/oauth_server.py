
#!/usr/bin/env python3
"""
FastAPI server to handle Reddit OAuth redirect and extract state parameter
"""

from fastapi import FastAPI, Request, Query
from fastapi.responses import HTMLResponse
import uvicorn
from typing import Optional
import praw
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Reddit OAuth Handler")

@app.get("/")
async def handle_redirect(
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None)
):
    """Handle the OAuth redirect from Reddit"""
    
    if error:
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h1>OAuth Error</h1>
                    <p>Error: {error}</p>
                </body>
            </html>
            """,
            status_code=400
        )
    
    if not code or not state:
        return HTMLResponse(
            content="""
            <html>
                <body>
                    <h1>OAuth Error</h1>
                    <p>Missing required parameters (code or state)</p>
                </body>
            </html>
            """,
            status_code=400
        )
    
    # Exchange authorization code for tokens
    try:
        reddit = praw.Reddit(
            client_id=os.environ["REDDIT_CLIENT_ID"],
            client_secret=os.environ["REDDIT_CLIENT_SECRET"],
            redirect_uri=os.environ.get("REDDIT_REDIRECT_URI", "http://localhost:8000"),
            user_agent=os.environ.get("REDDIT_USER_AGENT", "oauth_server by u/your_username"),
        )
        
        refresh_token = reddit.auth.authorize(code)
        user = reddit.user.me()
        
        print(f"Authorization successful!")
        print(f"User: {user.name}")
        print(f"Refresh Token: {refresh_token}")
        print(f"Access Token: {reddit.auth._authenticator.access_token}")
        
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h1>Reddit OAuth Success</h1>
                    <p><strong>User:</strong> {user.name}</p>
                    <p><strong>Refresh Token:</strong> {refresh_token}</p>
                    <p><strong>Scopes:</strong> {', '.join(reddit.auth.scopes())}</p>
                    <p>Tokens have been logged to the server console.</p>
                    <p>You can now close this window.</p>
                </body>
            </html>
            """
        )
        
    except Exception as e:
        print(f"OAuth error: {e}")
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h1>OAuth Token Exchange Failed</h1>
                    <p>Error: {str(e)}</p>
                </body>
            </html>
            """,
            status_code=500
        )

if __name__ == "__main__":
    print("Starting OAuth redirect server on http://localhost:8000")
    print("Make sure your Reddit app redirect URI is set to: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)



    this is this this tsdgfsdg    thishgjgn
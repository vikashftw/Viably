from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from jira import JIRA
import os
from requests_oauthlib import OAuth2Session
import requests

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

router = APIRouter()

# Environment variables for Jira OAuth 2.0
JIRA_SERVER = os.getenv("JIRA_SERVER")
JIRA_CLIENT_ID = os.getenv("JIRA_CLIENT_ID")
JIRA_CLIENT_SECRET = os.getenv("JIRA_CLIENT_SECRET")
JIRA_REDIRECT_URI = os.getenv("JIRA_REDIRECT_URI", "http://localhost:8000/api/jira/callback")

# In-memory storage for the token and Jira instance (for prototype purposes)
token_storage = {}
cloud_id_storage = None
jira_connected = False

# OAuth 2.0 settings
authorization_base_url = 'https://auth.atlassian.com/authorize'
token_url = 'https://auth.atlassian.com/oauth/token'
scope = ['read:jira-work', 'write:jira-work', 'read:jira-user']

@router.get("/status")
async def get_jira_status():
    """
    Checks if the Jira account is connected.
    """
    global jira_connected
    return {"connected": jira_connected}

@router.get("/connect")
async def connect_jira():
    """
    Initiates the Jira OAuth 2.0 connection process.
    """
    if not all([JIRA_SERVER, JIRA_CLIENT_ID, JIRA_CLIENT_SECRET]):
        raise HTTPException(status_code=500, detail="Jira environment variables not set.")

    jira_oauth = OAuth2Session(JIRA_CLIENT_ID, redirect_uri=JIRA_REDIRECT_URI, scope=scope)
    authorization_url, state = jira_oauth.authorization_url(
        authorization_base_url,
        audience="api.atlassian.com"
    )

    return {"authorization_url": authorization_url}


@router.get("/callback")
async def jira_callback(request: Request):
    """
    Handles the callback from Jira after user authorization.
    """
    global token_storage, cloud_id_storage, jira_connected

    try:
        jira_oauth = OAuth2Session(JIRA_CLIENT_ID, redirect_uri=JIRA_REDIRECT_URI)
        token = jira_oauth.fetch_token(token_url, client_secret=JIRA_CLIENT_SECRET,
                                       authorization_response=str(request.url))
        
        token_storage = token

        # Get the cloudid
        auth_header = {'Authorization': f'Bearer {token["access_token"]}'}
        resources_res = requests.get('https://api.atlassian.com/oauth/token/accessible-resources', headers=auth_header)
        resources_res.raise_for_status()
        resources = resources_res.json()

        if not resources:
            raise HTTPException(status_code=403, detail="No accessible Jira sites found for this user.")

        cloud_id_storage = resources[0]['id']
        jira_connected = True

        return RedirectResponse(url="http://localhost:3000")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch token or cloudid: {str(e)}")

@router.post("/disconnect")
async def disconnect_jira():
    """
    Disconnects the Jira account.
    """
    global token_storage, cloud_id_storage, jira_connected
    token_storage = {}
    cloud_id_storage = None
    jira_connected = False
    return {"connected": False}

@router.get("/backlog")
async def get_jira_backlog():
    """
    Fetches Jira backlog issues manually.
    """
    global token_storage, cloud_id_storage, jira_connected
    if not jira_connected or not cloud_id_storage or not token_storage:
        raise HTTPException(status_code=401, detail="Jira not connected.")

    try:
        access_token = token_storage.get('access_token')
        if not access_token:
            raise HTTPException(status_code=401, detail="Invalid token.")

        auth_header = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        # Construct the correct API URL (using new v3 endpoint)
        api_url = f"https://api.atlassian.com/ex/jira/{cloud_id_storage}/rest/api/3/search/jql"

        # JQL to get issues - v3 endpoint requires POST with JSON body
        # Jira Cloud requires bounded queries, so we filter by recent issues
        # Must explicitly request fields in v3 API
        payload = {
            'jql': 'created >= -90d order by created DESC',
            'maxResults': 50,
            'fields': ['key', 'summary', 'status']
        }

        response = requests.post(api_url, headers=auth_header, json=payload)

        # Better error handling - show Jira's error message
        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(status_code=500, detail=f"Jira API error ({response.status_code}): {error_detail}")

        jira_data = response.json()

        # Log the raw response to debug
        print(f"DEBUG: Jira API response: {jira_data}")

        all_issues = []
        # Try both 'values' and 'issues' fields
        issues_list = jira_data.get('values', jira_data.get('issues', []))

        for issue in issues_list:
            all_issues.append({
                "id": issue.get('key'),
                "summary": issue.get('fields', {}).get('summary'),
                "status": issue.get('fields', {}).get('status', {}).get('name')
            })

        return {"issues": all_issues, "total": len(all_issues), "raw_count": jira_data.get('total', 0)}
    except HTTPException:
        raise
    except Exception as e:
        # It's possible the token expired. For a full implementation, you'd refresh it here.
        raise HTTPException(status_code=500, detail=f"Failed to fetch Jira backlog: {str(e)}")

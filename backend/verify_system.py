import requests
import json
import sys

BASE_URL = "http://localhost:8080/api"
EMAIL = "verifier@test.com"
PASSWORD = "password123"
NAME = "System Verifier"

session = requests.Session()

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def check(condition, msg, resp=None):
    if condition:
        log(f"{msg} - SUCCESS", "PASS")
    else:
        details = ""
        if resp:
            try:
                details = f" (Status: {resp.status_code}, Body: {resp.text})"
            except:
                pass
        log(f"{msg} - FAILED{details}", "FAIL")
        sys.exit(1)

def register_or_login():
    # Try login first
    log(f"Attempting login for {EMAIL}...")
    try:
        resp = session.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if resp.status_code == 200:
            token = resp.json()['accessToken']
            log("Login successful!")
            return token
    except Exception as e:
        log(f"Login failed: {e}", "WARN")

    # Try register
    log(f"Attempting registration for {EMAIL}...")
    resp = session.post(f"{BASE_URL}/auth/register", json={"displayName": NAME, "email": EMAIL, "password": PASSWORD})
    if resp.status_code == 201:
        token = resp.json()['accessToken']
        log("Registration successful!")
        return token
    elif resp.status_code == 400:
        log(f"Registration failed: {resp.text}", "ERROR")
        # Maybe user exists but login failed? 
        sys.exit(1)
    else:
        log(f"Registration failed with status {resp.status_code}: {resp.text}", "ERROR")
        sys.exit(1)

def run_verification():
    token = register_or_login()
    headers = {"Authorization": f"Bearer {token}"}
    session.headers.update(headers)

    # 1. Verification of Workspace
    log("--- Verifying Workspaces ---")
    ws_name = "Verification Workspace"
    resp = session.post(f"{BASE_URL}/workspaces", json={"name": ws_name, "description": "Auto-generated"})
    check(resp.status_code == 201, "Create Workspace", resp)
    ws_id = resp.json()['id']
    log(f"Workspace ID: {ws_id}")

    resp = session.get(f"{BASE_URL}/workspaces")
    check(resp.status_code == 200, "List Workspaces", resp)
    workspaces = resp.json()
    check(any(w['id'] == ws_id for w in workspaces), "Verify Workspace in List")

    # 2. Verification of Project
    log("--- Verifying Projects ---")
    proj_name = "Verification Project"
    resp = session.post(f"{BASE_URL}/workspaces/{ws_id}/projects", json={"name": proj_name, "description": "Auto-generated"})
    check(resp.status_code == 201, "Create Project", resp)
    proj_id = resp.json()['id']
    log(f"Project ID: {proj_id}")

    resp = session.get(f"{BASE_URL}/workspaces/{ws_id}/projects")
    check(resp.status_code == 200, "List Projects", resp)
    projects = resp.json()
    check(any(p['id'] == proj_id for p in projects), "Verify Project in List")

    # 3. Verification of Workflow Builder
    log("--- Verifying Workflow Builder ---")
    wf_name = "Verification Workflow"
    resp = session.post(f"{BASE_URL}/workspaces/{ws_id}/workflows", json={"name": wf_name, "description": "Auto-generated"})
    check(resp.status_code == 201, "Create Workflow", resp)
    wf_id = resp.json()['id']
    log(f"Workflow ID: {wf_id}")

    # Add State
    state_name = "Verification State"
    resp = session.post(f"{BASE_URL}/workflows/{wf_id}/states", json={
        "name": state_name,
        "type": "IN_PROGRESS",
        "positionX": 100.0,
        "positionY": 100.0
    })
    print(f"ADD STATE RESP: {resp.status_code}")
    try:
        print(json.dumps(resp.json(), indent=2))
    except:
        print(resp.text)
    check(resp.status_code == 201, "Add State with Position", resp)
    state_id = resp.json()['id']
    
    # Update Positions
    log("Updating state positions...")
    new_x, new_y = 500.0, 500.0
    resp = session.put(f"{BASE_URL}/workflows/{wf_id}/states/positions", json=[{
        "stateId": state_id,
        "positionX": new_x,
        "positionY": new_y
    }])
    check(resp.status_code == 200, "Update Positions", resp)

    # Verify positions persisted
    resp = session.get(f"{BASE_URL}/workflows/{wf_id}")
    check(resp.status_code == 200, "Get Workflow Details", resp)
    workflow = resp.json()
    state = next(s for s in workflow['states'] if s['id'] == state_id)
    check(state['positionX'] == new_x and state['positionY'] == new_y, f"Verify Position Persistence ({state['positionX']}, {state['positionY']})")

    log("--- Verification Complete ---")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        log(f"Verification failed with exception: {e}", "ERROR")
        sys.exit(1)

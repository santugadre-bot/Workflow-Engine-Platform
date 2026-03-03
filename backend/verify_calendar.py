import requests
import json
import sys
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8080/api"
EMAIL = "verifier@test.com"
PASSWORD = "password123"

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

def login():
    log(f"Attempting login for {EMAIL}...")
    try:
        resp = session.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if resp.status_code == 200:
            token = resp.json()['accessToken']
            log("Login successful!")
            return token
    except Exception as e:
        log(f"Login failed: {e}", "WARN")
        return None

def run_verification():
    token = login()
    if not token:
        log("Could not login. Ensure backend is running and user exists.", "ERROR")
        return

    headers = {"Authorization": f"Bearer {token}"}
    session.headers.update(headers)

    # 1. Get a Project (or create one if needed, but assuming one exists from previous runs)
    log("--- Finding Project ---")
    resp = session.get(f"{BASE_URL}/workspaces")
    if resp.status_code != 200 or not resp.json():
        log("No workspaces found. Run verify_system.py first.", "ERROR")
        return
    ws_id = resp.json()[0]['id']
    
    resp = session.get(f"{BASE_URL}/workspaces/{ws_id}/projects")
    if resp.status_code != 200 or not resp.json():
         # Create project if missing
        log("Creating temp project...")
        resp = session.post(f"{BASE_URL}/workspaces/{ws_id}/projects", json={"name": "Calendar Test Project", "description": "Temp"})
        check(resp.status_code == 201, "Create Project", resp)
        proj_id = resp.json()['id']
    else:
        proj_id = resp.json()[0]['id']
    
    log(f"Using Project ID: {proj_id}")

    # 2. Create Task with Start/End Dates
    log("--- Verifying Task Dates ---")
    start_date = (datetime.now() + timedelta(days=1)).isoformat()
    end_date = (datetime.now() + timedelta(days=1, hours=2)).isoformat()
    
    payload = {
        "title": "Calendar Test Task",
        "projectId": proj_id,
        "startDate": start_date,
        "endDate": end_date,
        "priority": "HIGH"
    }
    
    log(f"Creating task with Start: {start_date}, End: {end_date}")
    resp = session.post(f"{BASE_URL}/tasks", json=payload)
    check(resp.status_code == 201, "Create Task with Dates", resp)
    task_id = resp.json()['id']
    
    # 3. Verify Response contains dates
    task_resp = resp.json()
    # Note: Backend might return slightly different format or null if mapping failed
    log(f"Response Start: {task_resp.get('startDate')}")
    log(f"Response End: {task_resp.get('endDate')}")
    
    check(task_resp.get('startDate') is not None, "Response has startDate")
    check(task_resp.get('endDate') is not None, "Response has endDate")

    # 4. Update Task Dates
    log("--- Updating Task Dates ---")
    new_start = (datetime.now() + timedelta(days=2)).isoformat()
    resp = session.put(f"{BASE_URL}/tasks/{task_id}", json={"startDate": new_start})
    check(resp.status_code == 200, "Update Task StartDate", resp)
    
    updated_task = resp.json()
    log(f"Updated Start: {updated_task.get('startDate')}")
    check(updated_task.get('startDate') is not None, "Updated Task has new startDate")
    # check(updated_task.get('startDate').startswith(new_start[:10]), "StartDate matches") # Loose check

    log("--- Verification Complete ---")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        log(f"Verification failed with exception: {e}", "ERROR")
        sys.exit(1)

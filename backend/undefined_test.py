import requests
import json

base_url = "http://localhost:8080/api"

def test_undefined():
    token = "fake" # Doesn't matter if it's public or if we hit the catch-all
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test a non-existent URL that looks like a valid pattern but with 'undefined'
    url = f"{base_url}/workspaces/undefined/projects"
    response = requests.get(url, headers=headers)
    print(f"Undefined URL Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")

test_undefined()

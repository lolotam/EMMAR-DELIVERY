#!/usr/bin/env python3
"""Simple test to verify Flask routes are working"""

import requests
import sys

def test_routes():
    base_url = "http://localhost:1111"
    
    routes_to_test = [
        "/",
        "/documents", 
        "/orders",
        "/api/health"
    ]
    
    print("Testing Flask routes:")
    
    for route in routes_to_test:
        try:
            url = f"{base_url}{route}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"[PASS] {route} - Status: {response.status_code}")
            else:
                print(f"[FAIL] {route} - Status: {response.status_code}")
                print(f"   Response: {response.text[:100]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] {route} - Error: {e}")
    
    print("\nDone testing routes.")

if __name__ == "__main__":
    test_routes()
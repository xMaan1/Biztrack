import requests
import sys
import os

API_URL = os.getenv("API_URL", "http://localhost:8000")

def test_inventory_routes():
    print(f"Testing inventory routes at: {API_URL}")
    print("=" * 60)
    
    endpoints = [
        "/inventory/health",
        "/inventory/dashboard",
        "/inventory/warehouses",
        "/inventory/storage-locations",
        "/inventory/stock-movements",
        "/inventory/purchase-orders",
        "/inventory/receivings",
        "/inventory/dumps",
        "/inventory/customer-returns",
        "/inventory/supplier-returns",
    ]
    
    token = os.getenv("AUTH_TOKEN", "")
    tenant_id = os.getenv("TENANT_ID", "")
    
    headers = {
        "Content-Type": "application/json",
    }
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if tenant_id:
        headers["X-Tenant-ID"] = tenant_id
    
    results = []
    
    for endpoint in endpoints:
        url = f"{API_URL}{endpoint}"
        try:
            print(f"\nTesting: {endpoint}")
            response = requests.get(url, headers=headers, timeout=10)
            status = "✓" if response.status_code < 400 else "✗"
            print(f"  {status} Status: {response.status_code}")
            
            if response.status_code >= 400:
                try:
                    error_data = response.json()
                    print(f"  Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"  Error: {response.text[:200]}")
            
            results.append({
                "endpoint": endpoint,
                "status": response.status_code,
                "success": response.status_code < 400
            })
        except requests.exceptions.ConnectionError:
            print(f"  ✗ Connection Error: Could not connect to {API_URL}")
            results.append({
                "endpoint": endpoint,
                "status": "CONNECTION_ERROR",
                "success": False
            })
        except requests.exceptions.Timeout:
            print(f"  ✗ Timeout: Request took too long")
            results.append({
                "endpoint": endpoint,
                "status": "TIMEOUT",
                "success": False
            })
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            results.append({
                "endpoint": endpoint,
                "status": "ERROR",
                "success": False,
                "error": str(e)
            })
    
    print("\n" + "=" * 60)
    print("Summary:")
    successful = sum(1 for r in results if r["success"])
    total = len(results)
    print(f"Successful: {successful}/{total}")
    
    if successful < total:
        print("\nFailed endpoints:")
        for r in results:
            if not r["success"]:
                print(f"  - {r['endpoint']}: {r['status']}")
    
    return results

if __name__ == "__main__":
    test_inventory_routes()


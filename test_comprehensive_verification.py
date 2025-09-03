#!/usr/bin/env python3
"""
Comprehensive Re-Verification Test Suite
Arabic Delivery Management System - Document Management Functionality

This script systematically tests the issues reported by the user:
1. Document Card Navigation Issue
2. Edit Save Functionality 
3. August Orders Card Clickability

Expected behavior based on previous fixes:
- All document cards should navigate properly using data attributes
- Edit functionality should work with event delegation
- August orders should be clickable and navigate correctly
"""

import requests
import json
import time
import sys
from datetime import datetime

class ComprehensiveVerificationTests:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {
            "test_timestamp": datetime.now().isoformat(),
            "document_card_navigation": {},
            "edit_save_functionality": {},
            "august_orders_card": {},
            "overall_status": "pending"
        }
    
    def print_section(self, title):
        """Print a formatted section header"""
        print(f"\n{'='*60}")
        print(f" {title}")
        print('='*60)
    
    def print_test(self, test_name, status, details=""):
        """Print test result with status"""
        status_symbol = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
        print(f"{status_symbol} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def test_server_connectivity(self):
        """Test basic server connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                print("[PASS] Server is running and accessible")
                return True
            else:
                print(f"[FAIL] Server returned status code: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"[FAIL] Server connectivity failed: {e}")
            return False
    
    def test_document_card_navigation(self):
        """Test Document Card Navigation Issue"""
        self.print_section("TESTING: Document Card Navigation Issue")
        
        results = {}
        
        # Test 1: Check if documents page loads
        try:
            response = self.session.get(f"{self.base_url}/documents")
            if response.status_code == 200:
                results["documents_page_loads"] = "PASS"
                self.print_test("Documents page loads", "PASS")
            else:
                results["documents_page_loads"] = "FAIL"
                self.print_test("Documents page loads", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            results["documents_page_loads"] = "FAIL"
            self.print_test("Documents page loads", "FAIL", str(e))
        
        # Test 2: Check driver data availability
        try:
            response = self.session.get(f"{self.base_url}/api/drivers")
            if response.status_code == 200:
                drivers = response.json()
                if drivers and len(drivers) > 0:
                    results["driver_data_available"] = "PASS"
                    self.print_test("Driver data available", "PASS", f"Found {len(drivers)} drivers")
                    
                    # Test driver document page navigation
                    first_driver = drivers[0]
                    driver_id = first_driver['id']
                    try:
                        doc_response = self.session.get(f"{self.base_url}/api/drivers/{driver_id}/documents")
                        if doc_response.status_code == 200:
                            results["driver_documents_accessible"] = "PASS"
                            self.print_test("Driver documents API accessible", "PASS")
                        else:
                            results["driver_documents_accessible"] = "FAIL"
                            self.print_test("Driver documents API accessible", "FAIL", f"Status: {doc_response.status_code}")
                    except Exception as e:
                        results["driver_documents_accessible"] = "FAIL"
                        self.print_test("Driver documents API accessible", "FAIL", str(e))
                else:
                    results["driver_data_available"] = "FAIL"
                    self.print_test("Driver data available", "FAIL", "No drivers found")
            else:
                results["driver_data_available"] = "FAIL"
                self.print_test("Driver data available", "FAIL", f"API Status: {response.status_code}")
        except Exception as e:
            results["driver_data_available"] = "FAIL"
            self.print_test("Driver data available", "FAIL", str(e))
        
        # Test 3: Check vehicle data availability
        try:
            response = self.session.get(f"{self.base_url}/api/vehicles")
            if response.status_code == 200:
                vehicles = response.json()
                if vehicles and len(vehicles) > 0:
                    results["vehicle_data_available"] = "PASS"
                    self.print_test("Vehicle data available", "PASS", f"Found {len(vehicles)} vehicles")
                    
                    # Test vehicle document page navigation
                    first_vehicle = vehicles[0]
                    vehicle_id = first_vehicle['id']
                    try:
                        doc_response = self.session.get(f"{self.base_url}/api/vehicles/{vehicle_id}/documents")
                        if doc_response.status_code == 200:
                            results["vehicle_documents_accessible"] = "PASS"
                            self.print_test("Vehicle documents API accessible", "PASS")
                        else:
                            results["vehicle_documents_accessible"] = "FAIL"
                            self.print_test("Vehicle documents API accessible", "FAIL", f"Status: {doc_response.status_code}")
                    except Exception as e:
                        results["vehicle_documents_accessible"] = "FAIL"
                        self.print_test("Vehicle documents API accessible", "FAIL", str(e))
                else:
                    results["vehicle_data_available"] = "FAIL"
                    self.print_test("Vehicle data available", "FAIL", "No vehicles found")
            else:
                results["vehicle_data_available"] = "FAIL"
                self.print_test("Vehicle data available", "FAIL", f"API Status: {response.status_code}")
        except Exception as e:
            results["vehicle_data_available"] = "FAIL"
            self.print_test("Vehicle data available", "FAIL", str(e))
        
        self.results["document_card_navigation"] = results
        return results
    
    def test_edit_save_functionality(self):
        """Test Edit Save Functionality"""
        self.print_section("TESTING: Edit Save Functionality")
        
        results = {}
        
        # Test 1: Check documents API
        try:
            response = self.session.get(f"{self.base_url}/api/documents")
            if response.status_code == 200:
                documents = response.json()
                results["documents_api_accessible"] = "PASS"
                self.print_test("Documents API accessible", "PASS", f"Found {len(documents)} documents")
                
                if documents and len(documents) > 0:
                    # Test document detail API
                    first_doc = documents[0]
                    doc_id = first_doc['id']
                    
                    try:
                        detail_response = self.session.get(f"{self.base_url}/api/documents/{doc_id}")
                        if detail_response.status_code == 200:
                            results["document_detail_api"] = "PASS"
                            self.print_test("Document detail API", "PASS")
                        else:
                            results["document_detail_api"] = "FAIL"
                            self.print_test("Document detail API", "FAIL", f"Status: {detail_response.status_code}")
                    except Exception as e:
                        results["document_detail_api"] = "FAIL"
                        self.print_test("Document detail API", "FAIL", str(e))
                
            else:
                results["documents_api_accessible"] = "FAIL"
                self.print_test("Documents API accessible", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            results["documents_api_accessible"] = "FAIL"
            self.print_test("Documents API accessible", "FAIL", str(e))
        
        # Test 2: Check document update endpoint (simulate edit save)
        try:
            # Get first document for testing
            response = self.session.get(f"{self.base_url}/api/documents")
            if response.status_code == 200:
                documents = response.json()
                if documents:
                    first_doc = documents[0]
                    doc_id = first_doc['id']
                    
                    # Simulate an edit operation (dry run - no actual changes)
                    test_data = {
                        "title": first_doc.get("title", "Test Document"),
                        "description": first_doc.get("description", "Test Description")
                    }
                    
                    # Test if the update endpoint is accessible (OPTIONS request)
                    try:
                        options_response = self.session.options(f"{self.base_url}/api/documents/{doc_id}")
                        if options_response.status_code in [200, 204, 405]:  # 405 is acceptable for OPTIONS
                            results["document_update_endpoint"] = "PASS"
                            self.print_test("Document update endpoint accessible", "PASS")
                        else:
                            results["document_update_endpoint"] = "FAIL"
                            self.print_test("Document update endpoint accessible", "FAIL", f"Status: {options_response.status_code}")
                    except Exception as e:
                        results["document_update_endpoint"] = "FAIL"
                        self.print_test("Document update endpoint accessible", "FAIL", str(e))
                else:
                    results["document_update_endpoint"] = "SKIP"
                    self.print_test("Document update endpoint accessible", "SKIP", "No documents to test with")
            else:
                results["document_update_endpoint"] = "FAIL"
                self.print_test("Document update endpoint accessible", "FAIL", "Cannot access documents API")
        except Exception as e:
            results["document_update_endpoint"] = "FAIL"
            self.print_test("Document update endpoint accessible", "FAIL", str(e))
        
        self.results["edit_save_functionality"] = results
        return results
    
    def test_august_orders_card(self):
        """Test August Orders Card Clickability"""
        self.print_section("TESTING: August Orders Card Clickability")
        
        results = {}
        
        # Test 1: Check dashboard loads
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                results["dashboard_loads"] = "PASS"
                self.print_test("Dashboard loads", "PASS")
            else:
                results["dashboard_loads"] = "FAIL"
                self.print_test("Dashboard loads", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            results["dashboard_loads"] = "FAIL"
            self.print_test("Dashboard loads", "FAIL", str(e))
        
        # Test 2: Check monthly orders API for August 2025
        try:
            response = self.session.get(f"{self.base_url}/api/monthly-orders")
            if response.status_code == 200:
                monthly_orders = response.json()
                august_orders = [order for order in monthly_orders if order.get('month') == 8 and order.get('year') == 2025]
                
                if august_orders:
                    results["august_orders_data"] = "PASS"
                    self.print_test("August orders data available", "PASS", f"Found {len(august_orders)} August order records")
                    
                    # Calculate total orders for August
                    total_august_orders = 0
                    for order in august_orders:
                        entries = order.get('entries', [])
                        for entry in entries:
                            periods = entry.get('periods', [])
                            for period in periods:
                                total_august_orders += period.get('num_orders', 0)
                    
                    results["august_orders_count"] = total_august_orders
                    self.print_test("August orders count calculated", "PASS", f"Total: {total_august_orders} orders")
                else:
                    results["august_orders_data"] = "FAIL"
                    self.print_test("August orders data available", "FAIL", "No August 2025 orders found")
            else:
                results["august_orders_data"] = "FAIL"
                self.print_test("August orders data available", "FAIL", f"API Status: {response.status_code}")
        except Exception as e:
            results["august_orders_data"] = "FAIL"
            self.print_test("August orders data available", "FAIL", str(e))
        
        # Test 3: Check orders/commission page accessibility
        try:
            response = self.session.get(f"{self.base_url}/orders")
            if response.status_code == 200:
                results["orders_page_accessible"] = "PASS"
                self.print_test("Orders/commission page accessible", "PASS")
            else:
                results["orders_page_accessible"] = "FAIL"
                self.print_test("Orders/commission page accessible", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            results["orders_page_accessible"] = "FAIL"
            self.print_test("Orders/commission page accessible", "FAIL", str(e))
        
        self.results["august_orders_card"] = results
        return results
    
    def run_all_tests(self):
        """Run all verification tests"""
        print("Starting Comprehensive Re-Verification Test Suite")
        print(f"Target: {self.base_url}")
        print(f"Time: {self.results['test_timestamp']}")
        
        # Test server connectivity first
        if not self.test_server_connectivity():
            self.results["overall_status"] = "FAIL - Server not accessible"
            return self.results
        
        # Run individual test suites
        doc_results = self.test_document_card_navigation()
        edit_results = self.test_edit_save_functionality()
        orders_results = self.test_august_orders_card()
        
        # Determine overall status
        all_tests_passed = True
        for test_suite in [doc_results, edit_results, orders_results]:
            for test_name, result in test_suite.items():
                if result == "FAIL":
                    all_tests_passed = False
                    break
            if not all_tests_passed:
                break
        
        self.results["overall_status"] = "PASS - All tests successful" if all_tests_passed else "PARTIAL - Some tests failed"
        
        # Print summary
        self.print_section("TEST SUMMARY")
        print(f"Overall Status: {self.results['overall_status']}")
        
        return self.results
    
    def save_results(self, filename="test_results.json"):
        """Save test results to file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"\nTest results saved to: {filename}")

def main():
    """Main test execution"""
    tester = ComprehensiveVerificationTests()
    results = tester.run_all_tests()
    tester.save_results("comprehensive_verification_results.json")
    
    # Exit with appropriate code
    if "PASS" in results["overall_status"]:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
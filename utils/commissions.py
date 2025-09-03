#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Commission Calculation Engine
محرك حساب العمولات
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
import json
import os

class CommissionCalculator:
    """Commission calculation engine with priority-based logic"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        else:
            self.data_dir = data_dir
    
    def load_config(self) -> Dict:
        """Load configuration from config.json"""
        try:
            config_path = os.path.join(self.data_dir, 'config.json')
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {
                'global_commission_per_order': 0.250,
                'currency': 'KWD'
            }
    
    def load_commission_rules(self) -> List[Dict]:
        """Load commission rules from commission_rules.json"""
        try:
            rules_path = os.path.join(self.data_dir, 'commission_rules.json')
            with open(rules_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def load_driver(self, driver_id: str) -> Optional[Dict]:
        """Load driver data"""
        try:
            from json_store import json_store
            return json_store.find_by_id('drivers', driver_id)
        except Exception:
            return None
    
    def load_client(self, client_id: str) -> Optional[Dict]:
        """Load client data"""
        try:
            from json_store import json_store
            return json_store.find_by_id('clients', client_id)
        except Exception:
            return None
    
    def calculate_commission(self, driver_id: str, client_id: str, order_date: str = None) -> Dict:
        """
        Calculate commission based on priority-based logic:
        1. Specific commission rules (driver + client + date range)
        2. Driver-specific commission for specific client
        3. Driver's default commission per order
        4. Client's commission rate
        5. Global commission per order (fallback)
        """
        try:
            # Load required data
            driver = self.load_driver(driver_id)
            client = self.load_client(client_id)
            config = self.load_config()
            commission_rules = self.load_commission_rules()
            
            if not driver:
                return {
                    'success': False,
                    'error': 'السائق غير موجود',
                    'commission': 0
                }
            
            if not client:
                return {
                    'success': False,
                    'error': 'العميل غير موجود',
                    'commission': 0
                }
            
            order_date = order_date or datetime.now().strftime('%Y-%m-%d')
            commission_amount = 0
            commission_source = 'global'
            
            # Priority 1: Specific commission rules (driver + client + date range)
            rule_commission = self._check_commission_rules(
                commission_rules, driver_id, client_id, order_date
            )
            if rule_commission is not None:
                commission_amount = rule_commission
                commission_source = 'rule'
            
            # Priority 2: Driver-specific commission for specific client
            elif self._has_client_specific_commission(driver, client_id):
                if client_id == driver.get('primary_client_id'):
                    commission_amount = driver.get('primary_client_commission', 0)
                    commission_source = 'driver_primary_client'
                elif client_id == driver.get('secondary_client_id'):
                    commission_amount = driver.get('secondary_client_commission', 0)
                    commission_source = 'driver_secondary_client'
            
            # Priority 3: Driver's default commission per order
            elif driver.get('default_commission_per_order'):
                commission_amount = float(driver.get('default_commission_per_order', 0))
                commission_source = 'driver_default'
            
            # Priority 4: Client's commission rate
            elif client.get('commission_rate'):
                commission_amount = float(client.get('commission_rate', 0))
                commission_source = 'client_rate'
            
            # Priority 5: Global commission per order (fallback)
            else:
                commission_amount = float(config.get('global_commission_per_order', 0.250))
                commission_source = 'global'
            
            return {
                'success': True,
                'commission': round(commission_amount, 3),
                'source': commission_source,
                'driver_name': driver.get('full_name', ''),
                'client_name': client.get('company_name', ''),
                'currency': config.get('currency', 'KWD'),
                'calculation_date': order_date
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في حساب العمولة: {str(e)}',
                'commission': 0
            }
    
    def _check_commission_rules(self, rules: List[Dict], driver_id: str, 
                               client_id: str, order_date: str) -> Optional[float]:
        """Check if there are specific commission rules for this combination"""
        order_date_obj = datetime.strptime(order_date, '%Y-%m-%d').date()
        
        for rule in rules:
            # Check if rule applies to this driver and client
            if (rule.get('driver_id') == driver_id and 
                rule.get('client_id') == client_id and
                rule.get('is_active', True)):
                
                # Check date range
                start_date = rule.get('start_date')
                end_date = rule.get('end_date')
                
                if start_date:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                    if order_date_obj < start_date_obj:
                        continue
                
                if end_date:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                    if order_date_obj > end_date_obj:
                        continue
                
                return float(rule.get('commission_amount', 0))
        
        return None
    
    def _has_client_specific_commission(self, driver: Dict, client_id: str) -> bool:
        """Check if driver has specific commission for this client"""
        return (client_id == driver.get('primary_client_id') or 
                client_id == driver.get('secondary_client_id'))
    
    def calculate_monthly_commission_total(self, driver_id: str, year: int, month: int) -> Dict:
        """Calculate total commission for a driver in a specific month"""
        try:
            from json_store import json_store

            # Get commission data from monthly_orders table (commission matrix)
            monthly_orders = json_store.read_all('monthly_orders')
            total_commission = 0
            total_orders = 0
            commission_details = []

            # Find all monthly order records for this driver and month/year
            for monthly_record in monthly_orders:
                if (monthly_record.get('driver_id') == driver_id and
                    monthly_record.get('month') == month and
                    monthly_record.get('year') == year):

                    # Process each client entry in this monthly record
                    for entry in monthly_record.get('entries', []):
                        client_id = entry.get('client_id')
                        commission_per_order = float(entry.get('commission_per_order', 0))

                        # Calculate total orders for this client in the specified month
                        client_orders_in_month = 0
                        for period in entry.get('periods', []):
                            # Check if period overlaps with the target month
                            date_from = period.get('date_from', '')
                            date_to = period.get('date_to', '')
                            num_orders = int(period.get('num_orders', 0))

                            if date_from and date_to:
                                try:
                                    from_date = datetime.strptime(date_from, '%Y-%m-%d')
                                    to_date = datetime.strptime(date_to, '%Y-%m-%d')

                                    # Check if period falls within the target month
                                    if (from_date.year == year and from_date.month == month) or \
                                       (to_date.year == year and to_date.month == month) or \
                                       (from_date.year <= year and from_date.month <= month and
                                        to_date.year >= year and to_date.month >= month):
                                        client_orders_in_month += num_orders
                                except (ValueError, TypeError):
                                    continue

                        if client_orders_in_month > 0:
                            client_commission = commission_per_order * client_orders_in_month
                            total_commission += client_commission
                            total_orders += client_orders_in_month

                            # Load client name for details
                            client = self.load_client(client_id)
                            client_name = client.get('company_name', f'Client {client_id}') if client else f'Client {client_id}'

                            commission_details.append({
                                'client_id': client_id,
                                'client_name': client_name,
                                'commission_per_order': commission_per_order,
                                'orders_count': client_orders_in_month,
                                'total_commission': round(client_commission, 3),
                                'source': 'monthly_matrix'
                            })

            driver = self.load_driver(driver_id)

            return {
                'success': True,
                'driver_id': driver_id,
                'driver_name': driver.get('full_name', '') if driver else '',
                'year': year,
                'month': month,
                'total_commission': round(total_commission, 3),
                'order_count': total_orders,
                'commission_details': commission_details,
                'currency': self.load_config().get('currency', 'KWD')
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في حساب إجمالي العمولة: {str(e)}',
                'total_commission': 0,
                'order_count': 0
            }
    
    def get_commission_summary(self, year: int, month: int) -> Dict:
        """Get commission summary for all drivers in a specific month"""
        try:
            from json_store import json_store
            drivers = json_store.read_all('drivers')
            
            summary = {
                'year': year,
                'month': month,
                'total_commission': 0,
                'total_orders': 0,
                'driver_summaries': [],
                'currency': self.load_config().get('currency', 'KWD')
            }
            
            for driver in drivers:
                if driver.get('is_active', True):
                    driver_summary = self.calculate_monthly_commission_total(
                        driver.get('id'), year, month
                    )
                    
                    if driver_summary.get('success'):
                        summary['total_commission'] += driver_summary.get('total_commission', 0)
                        summary['total_orders'] += driver_summary.get('order_count', 0)
                        summary['driver_summaries'].append(driver_summary)
            
            summary['total_commission'] = round(summary['total_commission'], 3)
            return summary
            
        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في تحميل ملخص العمولات: {str(e)}',
                'total_commission': 0
            }

# Global instance
commission_calculator = CommissionCalculator()

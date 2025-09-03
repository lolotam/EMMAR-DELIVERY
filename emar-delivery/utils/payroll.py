#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Payroll Calculation Engine
محرك حساب الرواتب
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json
import os

class PayrollCalculator:
    """Payroll calculation engine with commission totals and advance deductions"""
    
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
                'currency': 'KWD',
                'payroll_approval_required': True
            }
    
    def load_driver(self, driver_id: str) -> Optional[Dict]:
        """Load driver data"""
        try:
            from json_store import json_store
            return json_store.find_by_id('drivers', driver_id)
        except Exception:
            return None
    
    def get_driver_commissions(self, driver_id: str, year: int, month: int) -> Dict:
        """Get driver's commission total for a specific month"""
        try:
            from commissions import commission_calculator
            return commission_calculator.calculate_monthly_commission_total(driver_id, year, month)
        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في حساب العمولات: {str(e)}',
                'total_commission': 0
            }
    
    def get_driver_advances(self, driver_id: str, year: int, month: int) -> Dict:
        """Get driver's advance deductions for a specific month"""
        try:
            from json_store import json_store
            advances = json_store.filter_records('advances', {'driver_id': driver_id})
            
            # Filter active and partial advances
            active_advances = [
                advance for advance in advances
                if advance.get('status') in ['active', 'partial']
            ]
            
            total_deduction = 0
            advance_details = []
            
            driver = self.load_driver(driver_id)
            if not driver:
                return {
                    'success': False,
                    'error': 'السائق غير موجود',
                    'total_deduction': 0
                }

            for advance in active_advances:
                remaining_balance = float(advance.get('amount', 0)) - float(advance.get('paid_amount', 0))

                if remaining_balance <= 0:
                    continue

                # Get deduction settings from the advance itself
                deduction_mode = advance.get('advance_deduction_mode', 'fixed_amount')
                deduction_value = float(advance.get('advance_deduction_value', 50))

                # Calculate deduction amount
                if deduction_mode == 'fixed_amount':
                    deduction_amount = min(deduction_value, remaining_balance)
                elif deduction_mode == 'percentage':
                    # Get commission total for percentage calculation
                    commission_result = self.get_driver_commissions(driver_id, year, month)
                    commission_total = commission_result.get('total_commission', 0)
                    base_salary = float(driver.get('base_salary', 0))

                    total_earnings = commission_total + base_salary
                    percentage_deduction = (deduction_value / 100) * total_earnings
                    deduction_amount = min(percentage_deduction, remaining_balance)
                else:
                    deduction_amount = 0
                
                if deduction_amount > 0:
                    total_deduction += deduction_amount
                    advance_details.append({
                        'advance_id': advance.get('id'),
                        'advance_amount': advance.get('amount', 0),
                        'remaining_balance': remaining_balance,
                        'deduction_amount': round(deduction_amount, 3),
                        'reason': advance.get('reason', ''),
                        'deduction_mode': deduction_mode,
                        'deduction_value': deduction_value
                    })

            return {
                'success': True,
                'driver_id': driver_id,
                'total_deduction': round(total_deduction, 3),
                'advance_count': len(advance_details),
                'advance_details': advance_details
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في حساب خصم السُلف: {str(e)}',
                'total_deduction': 0
            }
    
    def calculate_driver_payroll(self, driver_id: str, year: int, month: int) -> Dict:
        """Calculate complete payroll for a driver"""
        try:
            driver = self.load_driver(driver_id)
            if not driver:
                return {
                    'success': False,
                    'error': 'السائق غير موجود'
                }
            
            # Get base salary
            base_salary = float(driver.get('base_salary', 0))
            
            # Get commission total
            commission_result = self.get_driver_commissions(driver_id, year, month)
            if not commission_result.get('success'):
                return commission_result
            
            commission_total = commission_result.get('total_commission', 0)
            order_count = commission_result.get('order_count', 0)
            
            # Get advance deductions
            advance_result = self.get_driver_advances(driver_id, year, month)
            if not advance_result.get('success'):
                return advance_result
            
            advance_deduction = advance_result.get('total_deduction', 0)
            
            # Calculate totals
            gross_salary = base_salary + commission_total
            net_salary = gross_salary - advance_deduction
            
            config = self.load_config()
            
            return {
                'success': True,
                'driver_id': driver_id,
                'driver_name': driver.get('full_name', ''),
                'employment_type': driver.get('employment_type', 'commission'),
                'year': year,
                'month': month,
                'base_salary': round(base_salary, 3),
                'commission_total': round(commission_total, 3),
                'order_count': order_count,
                'gross_salary': round(gross_salary, 3),
                'advance_deduction': round(advance_deduction, 3),
                'net_salary': round(net_salary, 3),
                'currency': config.get('currency', 'KWD'),
                'commission_details': commission_result.get('commission_details', []),
                'advance_details': advance_result.get('advance_details', []),
                'calculation_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في حساب الراتب: {str(e)}'
            }
    
    def calculate_payroll_run(self, year: int, month: int, driver_ids: List[str] = None) -> Dict:
        """Calculate payroll for multiple drivers"""
        try:
            from json_store import json_store
            
            if driver_ids is None:
                # Get all active drivers
                drivers = json_store.read_all('drivers')
                driver_ids = [d.get('id') for d in drivers if d.get('is_active', True)]
            
            payroll_results = []
            total_base_salary = 0
            total_commission = 0
            total_gross = 0
            total_deductions = 0
            total_net = 0
            
            for driver_id in driver_ids:
                driver_payroll = self.calculate_driver_payroll(driver_id, year, month)
                
                if driver_payroll.get('success'):
                    payroll_results.append(driver_payroll)
                    total_base_salary += driver_payroll.get('base_salary', 0)
                    total_commission += driver_payroll.get('commission_total', 0)
                    total_gross += driver_payroll.get('gross_salary', 0)
                    total_deductions += driver_payroll.get('advance_deduction', 0)
                    total_net += driver_payroll.get('net_salary', 0)
                else:
                    # Include failed calculations for reporting
                    payroll_results.append(driver_payroll)
            
            config = self.load_config()
            
            return {
                'success': True,
                'year': year,
                'month': month,
                'driver_count': len([r for r in payroll_results if r.get('success')]),
                'failed_count': len([r for r in payroll_results if not r.get('success')]),
                'payroll_results': payroll_results,
                'totals': {
                    'base_salary': round(total_base_salary, 3),
                    'commission': round(total_commission, 3),
                    'gross_salary': round(total_gross, 3),
                    'deductions': round(total_deductions, 3),
                    'net_salary': round(total_net, 3)
                },
                'currency': config.get('currency', 'KWD'),
                'calculation_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في حساب دفعة الرواتب: {str(e)}'
            }
    
    def process_advance_deductions(self, payroll_run_id: str, year: int, month: int) -> Dict:
        """Process advance deductions after payroll approval"""
        try:
            from json_store import json_store
            
            # Get payroll run data
            payroll_run = json_store.find_by_id('payroll_runs', payroll_run_id)
            if not payroll_run:
                return {
                    'success': False,
                    'error': 'دفعة الرواتب غير موجودة'
                }
            
            if payroll_run.get('status') != 'approved':
                return {
                    'success': False,
                    'error': 'دفعة الرواتب غير معتمدة'
                }
            
            processed_advances = []
            total_deducted = 0
            
            for driver_payroll in payroll_run.get('payroll_results', []):
                if not driver_payroll.get('success'):
                    continue
                
                driver_id = driver_payroll.get('driver_id')
                advance_details = driver_payroll.get('advance_details', [])
                
                for advance_detail in advance_details:
                    advance_id = advance_detail.get('advance_id')
                    deduction_amount = advance_detail.get('deduction_amount', 0)
                    
                    if deduction_amount > 0:
                        # Update advance record
                        advance = json_store.find_by_id('advances', advance_id)
                        if advance:
                            new_paid_amount = float(advance.get('paid_amount', 0)) + deduction_amount
                            advance_amount = float(advance.get('amount', 0))
                            
                            # Update status based on payment
                            if new_paid_amount >= advance_amount:
                                new_status = 'paid'
                            elif new_paid_amount > 0:
                                new_status = 'partial'
                            else:
                                new_status = 'active'
                            
                            json_store.update('advances', advance_id, {
                                'paid_amount': round(new_paid_amount, 3),
                                'status': new_status,
                                'last_deduction_date': datetime.now().strftime('%Y-%m-%d'),
                                'last_deduction_amount': deduction_amount
                            })
                            
                            processed_advances.append({
                                'advance_id': advance_id,
                                'driver_id': driver_id,
                                'deduction_amount': deduction_amount,
                                'new_paid_amount': round(new_paid_amount, 3),
                                'new_status': new_status
                            })
                            
                            total_deducted += deduction_amount
            
            # Update payroll run status
            json_store.update('payroll_runs', payroll_run_id, {
                'advance_deductions_processed': True,
                'total_deducted': round(total_deducted, 3),
                'processed_advances': processed_advances,
                'processing_date': datetime.now().isoformat()
            })
            
            return {
                'success': True,
                'payroll_run_id': payroll_run_id,
                'processed_count': len(processed_advances),
                'total_deducted': round(total_deducted, 3),
                'processed_advances': processed_advances
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'خطأ في معالجة خصم السُلف: {str(e)}'
            }

# Global instance
payroll_calculator = PayrollCalculator()

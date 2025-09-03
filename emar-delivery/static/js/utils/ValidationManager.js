/**
 * ValidationManager - Unified Form Validation Utility
 * Eliminates form validation code duplication across the application
 * 
 * Usage:
 * const validator = new ValidationManager();
 * const result = validator.validateField('email', 'test@example.com', { required: true });
 */

class ValidationManager {
    constructor() {
        this.VALIDATION_RULES = {
            required: {
                test: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
                message: 'هذا الحقل مطلوب'
            },
            email: {
                test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: 'البريد الإلكتروني غير صحيح'
            },
            phone: {
                test: (value) => /^\+965\d{8}$/.test(value),
                message: 'رقم الهاتف يجب أن يكون بصيغة +965XXXXXXXX'
            },
            phoneOptional: {
                test: (value) => !value || /^\+965\d{8}$/.test(value),
                message: 'رقم الهاتف يجب أن يكون بصيغة +965XXXXXXXX'
            },
            nationalId: {
                test: (value) => /^\d{12}$/.test(value),
                message: 'الرقم المدني يجب أن يكون 12 رقم'
            },
            date: {
                test: (value) => {
                    const date = new Date(value);
                    return !isNaN(date.getTime());
                },
                message: 'التاريخ غير صحيح'
            },
            futureDate: {
                test: (value) => {
                    const date = new Date(value);
                    return !isNaN(date.getTime()) && date > new Date();
                },
                message: 'التاريخ يجب أن يكون في المستقبل'
            },
            pastDate: {
                test: (value) => {
                    const date = new Date(value);
                    return !isNaN(date.getTime()) && date < new Date();
                },
                message: 'التاريخ يجب أن يكون في الماضي'
            },
            number: {
                test: (value) => !isNaN(parseFloat(value)) && isFinite(value),
                message: 'يجب أن يكون رقم صحيح'
            },
            positiveNumber: {
                test: (value) => !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) > 0,
                message: 'يجب أن يكون رقم موجب'
            },
            nonNegativeNumber: {
                test: (value) => !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) >= 0,
                message: 'يجب أن يكون رقم غير سالب'
            },
            minLength: {
                test: (value, min) => value && value.toString().length >= min,
                message: (min) => `يجب أن يكون على الأقل ${min} أحرف`
            },
            maxLength: {
                test: (value, max) => !value || value.toString().length <= max,
                message: (max) => `يجب أن يكون أقل من ${max} حرف`
            },
            minValue: {
                test: (value, min) => !isNaN(parseFloat(value)) && parseFloat(value) >= min,
                message: (min) => `يجب أن يكون على الأقل ${min}`
            },
            maxValue: {
                test: (value, max) => !isNaN(parseFloat(value)) && parseFloat(value) <= max,
                message: (max) => `يجب أن يكون أقل من أو يساوي ${max}`
            },
            pattern: {
                test: (value, pattern) => new RegExp(pattern).test(value),
                message: 'الصيغة غير صحيحة'
            },
            url: {
                test: (value) => {
                    try {
                        new URL(value);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'الرابط غير صحيح'
            },
            arabicText: {
                test: (value) => /^[\u0600-\u06FF\s]+$/.test(value),
                message: 'يجب أن يحتوي على نص عربي فقط'
            },
            englishText: {
                test: (value) => /^[a-zA-Z\s]+$/.test(value),
                message: 'يجب أن يحتوي على نص إنجليزي فقط'
            },
            alphanumeric: {
                test: (value) => /^[a-zA-Z0-9]+$/.test(value),
                message: 'يجب أن يحتوي على أحرف وأرقام فقط'
            }
        };
        
        this.FIELD_TYPES = {
            text: ['required', 'minLength', 'maxLength'],
            email: ['required', 'email'],
            phone: ['required', 'phone'],
            nationalId: ['required', 'nationalId'],
            date: ['required', 'date'],
            number: ['required', 'number'],
            positiveNumber: ['required', 'positiveNumber'],
            url: ['url'],
            arabicName: ['required', 'arabicText', 'minLength'],
            englishName: ['required', 'englishText', 'minLength']
        };
    }
    
    /**
     * Validate a single field
     * @param {string} fieldName - Name of the field
     * @param {any} value - Value to validate
     * @param {Object} rules - Validation rules
     * @returns {Object} - Validation result
     */
    validateField(fieldName, value, rules = {}) {
        const errors = [];
        
        // Skip validation if field is not required and value is empty
        if (!rules.required && (!value || value.toString().trim() === '')) {
            return { valid: true, errors: [] };
        }
        
        // Apply validation rules
        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const rule = this.VALIDATION_RULES[ruleName];
            if (!rule) {
                console.warn(`Unknown validation rule: ${ruleName}`);
                continue;
            }
            
            let isValid;
            let errorMessage;
            
            if (typeof rule.test === 'function') {
                if (ruleName === 'required') {
                    isValid = rule.test(value);
                } else if (typeof ruleValue === 'boolean' && ruleValue) {
                    isValid = rule.test(value);
                } else if (typeof ruleValue !== 'boolean') {
                    isValid = rule.test(value, ruleValue);
                } else {
                    continue; // Skip if rule is disabled
                }
                
                if (!isValid) {
                    if (typeof rule.message === 'function') {
                        errorMessage = rule.message(ruleValue);
                    } else {
                        errorMessage = rule.message;
                    }
                    
                    errors.push({
                        field: fieldName,
                        rule: ruleName,
                        message: errorMessage
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate multiple fields
     * @param {Object} data - Object with field values
     * @param {Object} schema - Validation schema
     * @returns {Object} - Validation result
     */
    validateForm(data, schema) {
        const results = {};
        const allErrors = [];
        let isValid = true;
        
        for (const [fieldName, rules] of Object.entries(schema)) {
            const value = data[fieldName];
            const result = this.validateField(fieldName, value, rules);
            
            results[fieldName] = result;
            
            if (!result.valid) {
                isValid = false;
                allErrors.push(...result.errors);
            }
        }
        
        return {
            valid: isValid,
            errors: allErrors,
            fieldResults: results
        };
    }
    
    /**
     * Validate using predefined field type
     * @param {string} fieldType - Type of field (email, phone, etc.)
     * @param {any} value - Value to validate
     * @param {Object} options - Additional options
     * @returns {Object} - Validation result
     */
    validateByType(fieldType, value, options = {}) {
        const defaultRules = this.FIELD_TYPES[fieldType];
        if (!defaultRules) {
            throw new Error(`Unknown field type: ${fieldType}`);
        }
        
        const rules = {};
        
        // Apply default rules
        defaultRules.forEach(ruleName => {
            rules[ruleName] = true;
        });
        
        // Override with custom options
        Object.assign(rules, options);
        
        return this.validateField(fieldType, value, rules);
    }
    
    /**
     * Create validation schema for common forms
     * @param {string} formType - Type of form
     * @returns {Object} - Validation schema
     */
    getFormSchema(formType) {
        const schemas = {
            driver: {
                full_name: { required: true, arabicText: true, minLength: 3 },
                national_id: { required: true, nationalId: true },
                phone: { required: true, phone: true },
                employment_date: { required: true, date: true },
                base_salary: { required: true, nonNegativeNumber: true },
                max_advance_limit: { required: true, positiveNumber: true }
            },
            vehicle: {
                plate_number: { required: true, minLength: 3, maxLength: 10 },
                model: { required: true, minLength: 2 },
                year: { required: true, number: true, minValue: 1990, maxValue: new Date().getFullYear() + 1 },
                purchase_date: { required: true, date: true, pastDate: true }
            },
            client: {
                name: { required: true, arabicText: true, minLength: 3 },
                phone: { required: true, phone: true },
                email: { email: true },
                address: { required: true, minLength: 10 }
            },
            order: {
                client_id: { required: true },
                pickup_address: { required: true, minLength: 5 },
                delivery_address: { required: true, minLength: 5 },
                order_date: { required: true, date: true },
                delivery_fee: { required: true, positiveNumber: true }
            },
            advance: {
                driver_id: { required: true },
                amount: { required: true, positiveNumber: true },
                date: { required: true, date: true },
                reason: { required: true, minLength: 5 }
            }
        };
        
        return schemas[formType] || {};
    }
    
    /**
     * Add custom validation rule
     * @param {string} ruleName - Name of the rule
     * @param {Function} testFunction - Test function
     * @param {string|Function} message - Error message
     */
    addCustomRule(ruleName, testFunction, message) {
        this.VALIDATION_RULES[ruleName] = {
            test: testFunction,
            message: message
        };
    }
    
    /**
     * Validate form element in real-time
     * @param {HTMLElement} element - Form element
     * @param {Object} rules - Validation rules
     * @returns {Object} - Validation result
     */
    validateElement(element, rules) {
        const value = element.value;
        const fieldName = element.name || element.id;
        const result = this.validateField(fieldName, value, rules);
        
        // Update element styling
        this.updateElementValidation(element, result);
        
        return result;
    }
    
    /**
     * Update element styling based on validation result
     * @param {HTMLElement} element - Form element
     * @param {Object} result - Validation result
     */
    updateElementValidation(element, result) {
        // Remove existing validation classes
        element.classList.remove('is-valid', 'is-invalid');
        
        // Add appropriate class
        if (result.valid) {
            element.classList.add('is-valid');
        } else {
            element.classList.add('is-invalid');
        }
        
        // Update or create error message
        const errorContainer = element.parentElement.querySelector('.invalid-feedback');
        if (errorContainer) {
            if (result.errors.length > 0) {
                errorContainer.textContent = result.errors[0].message;
                errorContainer.style.display = 'block';
            } else {
                errorContainer.style.display = 'none';
            }
        } else if (result.errors.length > 0) {
            // Create error message element
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = result.errors[0].message;
            errorDiv.style.cssText = 'color: #dc3545; font-size: 0.875em; margin-top: 0.25rem;';
            element.parentElement.appendChild(errorDiv);
        }
    }
    
    /**
     * Setup real-time validation for a form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} schema - Validation schema
     * @param {Object} options - Options
     */
    setupFormValidation(form, schema, options = {}) {
        const {
            validateOnInput = true,
            validateOnBlur = true,
            showErrors = true
        } = options;
        
        Object.keys(schema).forEach(fieldName => {
            const element = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (!element) return;
            
            const rules = schema[fieldName];
            
            if (validateOnInput) {
                element.addEventListener('input', () => {
                    if (showErrors) {
                        this.validateElement(element, rules);
                    }
                });
            }
            
            if (validateOnBlur) {
                element.addEventListener('blur', () => {
                    if (showErrors) {
                        this.validateElement(element, rules);
                    }
                });
            }
        });
        
        // Validate entire form on submit
        form.addEventListener('submit', (event) => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const result = this.validateForm(data, schema);
            
            if (!result.valid) {
                event.preventDefault();
                
                if (showErrors) {
                    // Show errors for all invalid fields
                    Object.keys(result.fieldResults).forEach(fieldName => {
                        const element = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
                        if (element) {
                            this.updateElementValidation(element, result.fieldResults[fieldName]);
                        }
                    });
                    
                    // Focus first invalid field
                    const firstInvalidField = form.querySelector('.is-invalid');
                    if (firstInvalidField) {
                        firstInvalidField.focus();
                    }
                }
            }
        });
    }
    
    /**
     * Get validation summary for display
     * @param {Object} validationResult - Result from validateForm
     * @returns {string} - HTML summary of errors
     */
    getErrorSummary(validationResult) {
        if (validationResult.valid) {
            return '';
        }
        
        const errorList = validationResult.errors
            .map(error => `<li>${error.message}</li>`)
            .join('');
        
        return `
            <div class="alert alert-danger" role="alert">
                <h6>يرجى تصحيح الأخطاء التالية:</h6>
                <ul class="mb-0">${errorList}</ul>
            </div>
        `;
    }
}

// Create global instance
const validationManager = new ValidationManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationManager;
} else {
    window.ValidationManager = ValidationManager;
    window.validationManager = validationManager;
}

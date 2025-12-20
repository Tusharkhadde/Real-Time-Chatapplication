// client/src/utils/validators.js
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function isValidPassword(password) {
  return password && password.length >= 6
}

export function isValidName(name) {
  return name && name.trim().length >= 2
}

export function validateLoginForm(data) {
  const errors = {}
  
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (!data.password) {
    errors.password = 'Password is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateRegisterForm(data) {
  const errors = {}
  
  if (!data.name) {
    errors.name = 'Name is required'
  } else if (!isValidName(data.name)) {
    errors.name = 'Name must be at least 2 characters'
  }
  
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (!data.password) {
    errors.password = 'Password is required'
  } else if (!isValidPassword(data.password)) {
    errors.password = 'Password must be at least 6 characters'
  }
  
  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = 'Passwords do not match'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateMessage(content) {
  if (!content || !content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' }
  }
  
  if (content.length > 5000) {
    return { isValid: false, error: 'Message is too long (max 5000 characters)' }
  }
  
  return { isValid: true, error: null }
}

export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = null
  } = options
  
  if (!file) {
    return { isValid: false, error: 'No file selected' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: `File is too large (max ${maxSize / 1024 / 1024}MB)` }
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' }
  }
  
  return { isValid: true, error: null }
}
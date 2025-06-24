import { AdminUser, LoginAttempt, AuthSession, AuthState } from '../types';
import { getCurrentTenant } from './tenantManager';

const STORAGE_KEYS = {
  ADMIN_USERS: 'beauty-salon-admin-users',
  LOGIN_ATTEMPTS: 'beauty-salon-login-attempts',
  AUTH_SESSION: 'beauty-salon-auth-session'
};

// Get tenant-specific storage key
const getTenantStorageKey = (key: string): string => {
  const tenant = getCurrentTenant();
  if (tenant) {
    return `tenant-${tenant.id}-${key}`;
  }
  return key; // Fallback to legacy key for backward compatibility
};

// Security constants - Removed all restrictions
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours (extended)

// Simple hash function for demonstration (in production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'beauty-salon-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate secure token
const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Username validation
export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('El nombre de usuario debe tener al menos 3 caracteres');
  }
  
  if (username.length > 20) {
    errors.push('El nombre de usuario no puede tener más de 20 caracteres');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Solo se permiten letras, números y guiones bajos');
  }
  
  if (/^\d/.test(username)) {
    errors.push('El nombre de usuario no puede comenzar con un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Initialize default admin user for current tenant
export const initializeDefaultAdmin = async (): Promise<void> => {
  const users = getAdminUsers();
  
  if (users.length === 0) {
    const tenant = getCurrentTenant();
    const defaultAdmin: AdminUser = {
      id: '1',
      username: 'admin',
      passwordHash: await hashPassword('Admin123!'),
      role: 'owner',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(defaultAdmin);
    localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.ADMIN_USERS), JSON.stringify(users));
  }
};

// Create admin user for new tenant
export const createTenantAdmin = async (tenantId: string, ownerData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AdminUser> => {
  const adminUser: AdminUser = {
    id: Date.now().toString(),
    username: ownerData.email.toLowerCase(), // Use email as username
    passwordHash: await hashPassword(ownerData.password),
    role: 'owner',
    createdAt: new Date().toISOString(),
    isActive: true
  };

  // Save to tenant-specific storage
  const tenantStorageKey = `tenant-${tenantId}-${STORAGE_KEYS.ADMIN_USERS}`;
  const existingUsers = localStorage.getItem(tenantStorageKey);
  const users = existingUsers ? JSON.parse(existingUsers) : [];
  
  users.push(adminUser);
  localStorage.setItem(tenantStorageKey, JSON.stringify(users));
  
  return adminUser;
};

// Get admin users for current tenant
export const getAdminUsers = (): AdminUser[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.ADMIN_USERS));
  return stored ? JSON.parse(stored) : [];
};

// Get login attempts
export const getLoginAttempts = (): LoginAttempt[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.LOGIN_ATTEMPTS));
  return stored ? JSON.parse(stored) : [];
};

// Record login attempt
export const recordLoginAttempt = (username: string, success: boolean): void => {
  const attempts = getLoginAttempts();
  const attempt: LoginAttempt = {
    id: Date.now().toString(),
    username: username.toLowerCase(),
    ipAddress: 'localhost', // In production, get real IP
    timestamp: new Date().toISOString(),
    success,
    userAgent: navigator.userAgent
  };
  
  attempts.push(attempt);
  
  // Keep only last 100 attempts
  if (attempts.length > 100) {
    attempts.splice(0, attempts.length - 100);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.LOGIN_ATTEMPTS), JSON.stringify(attempts));
};

// Check if user is locked out - DISABLED
export const isUserLockedOut = (username: string): boolean => {
  return false; // Always return false - no lockouts
};

// Get lockout time remaining - DISABLED
export const getLockoutTimeRemaining = (username: string): number => {
  return 0; // Always return 0 - no lockouts
};

// Authenticate user - Simplified without restrictions
export const authenticateUser = async (username: string, password: string): Promise<{
  success: boolean;
  user?: AdminUser;
  session?: AuthSession;
  error?: string;
}> => {
  const normalizedUsername = username.toLowerCase().trim();
  
  // Find user in current tenant
  const users = getAdminUsers();
  const user = users.find(u => u.username.toLowerCase() === normalizedUsername && u.isActive);
  
  if (!user) {
    recordLoginAttempt(normalizedUsername, false);
    return {
      success: false,
      error: 'Credenciales incorrectas'
    };
  }
  
  // Verify password
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    recordLoginAttempt(normalizedUsername, false);
    return {
      success: false,
      error: 'Credenciales incorrectas'
    };
  }
  
  // Create session
  const session: AuthSession = {
    id: generateToken(),
    userId: user.id,
    token: generateToken(),
    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    ipAddress: 'localhost',
    userAgent: navigator.userAgent
  };
  
  // Update user last login
  user.lastLogin = new Date().toISOString();
  const userIndex = users.findIndex(u => u.id === user.id);
  users[userIndex] = user;
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.ADMIN_USERS), JSON.stringify(users));
  
  // Save session
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.AUTH_SESSION), JSON.stringify(session));
  
  recordLoginAttempt(normalizedUsername, true);
  
  return {
    success: true,
    user,
    session
  };
};

// Get current session - Simplified without inactivity timeout
export const getCurrentSession = (): AuthSession | null => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.AUTH_SESSION));
  if (!stored) return null;
  
  const session: AuthSession = JSON.parse(stored);
  const now = new Date().getTime();
  const expiresAt = new Date(session.expiresAt).getTime();
  
  // Check if session expired (only check expiration, no inactivity)
  if (now > expiresAt) {
    logout();
    return null;
  }
  
  // Update last activity without timeout checks
  session.lastActivity = new Date().toISOString();
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.AUTH_SESSION), JSON.stringify(session));
  
  return session;
};

// Get current user
export const getCurrentUser = (): AdminUser | null => {
  const session = getCurrentSession();
  if (!session) return null;
  
  const users = getAdminUsers();
  return users.find(u => u.id === session.userId && u.isActive) || null;
};

// Logout
export const logout = (): void => {
  localStorage.removeItem(getTenantStorageKey(STORAGE_KEYS.AUTH_SESSION));
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return getCurrentSession() !== null;
};

// Create new admin user (only for owners)
export const createAdminUser = async (userData: {
  username: string;
  password: string;
  role: 'owner' | 'admin';
}, currentUser: AdminUser): Promise<{ success: boolean; error?: string }> => {
  if (currentUser.role !== 'owner') {
    return { success: false, error: 'No tienes permisos para crear usuarios' };
  }
  
  const users = getAdminUsers();
  const normalizedUsername = userData.username.toLowerCase().trim();
  
  // Check if username already exists
  if (users.some(u => u.username.toLowerCase() === normalizedUsername)) {
    return { success: false, error: 'El nombre de usuario ya existe' };
  }
  
  // Validate username
  const usernameValidation = validateUsername(userData.username);
  if (!usernameValidation.isValid) {
    return { success: false, error: usernameValidation.errors.join(', ') };
  }
  
  // Validate password
  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    return { success: false, error: passwordValidation.errors.join(', ') };
  }
  
  const newUser: AdminUser = {
    id: Date.now().toString(),
    username: normalizedUsername,
    passwordHash: await hashPassword(userData.password),
    role: userData.role,
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  users.push(newUser);
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.ADMIN_USERS), JSON.stringify(users));
  
  return { success: true };
};

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  user: AdminUser
): Promise<{ success: boolean; error?: string }> => {
  // Verify current password
  const currentPasswordHash = await hashPassword(currentPassword);
  if (currentPasswordHash !== user.passwordHash) {
    return { success: false, error: 'Contraseña actual incorrecta' };
  }
  
  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return { success: false, error: passwordValidation.errors.join(', ') };
  }
  
  // Update password
  const users = getAdminUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  users[userIndex].passwordHash = await hashPassword(newPassword);
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.ADMIN_USERS), JSON.stringify(users));
  
  // Record credential update
  recordCredentialUpdate(user.id, 'password');
  
  return { success: true };
};

// Change username
export const changeUsername = async (
  currentPassword: string,
  newUsername: string,
  user: AdminUser
): Promise<{ success: boolean; error?: string }> => {
  // Verify current password
  const currentPasswordHash = await hashPassword(currentPassword);
  if (currentPasswordHash !== user.passwordHash) {
    return { success: false, error: 'Contraseña actual incorrecta' };
  }
  
  // Validate new username
  const usernameValidation = validateUsername(newUsername);
  if (!usernameValidation.isValid) {
    return { success: false, error: usernameValidation.errors.join(', ') };
  }
  
  const users = getAdminUsers();
  const normalizedUsername = newUsername.toLowerCase().trim();
  
  // Check if username already exists
  if (users.some(u => u.username.toLowerCase() === normalizedUsername && u.id !== user.id)) {
    return { success: false, error: 'El nombre de usuario ya existe' };
  }
  
  // Update username
  const userIndex = users.findIndex(u => u.id === user.id);
  users[userIndex].username = normalizedUsername;
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.ADMIN_USERS), JSON.stringify(users));
  
  // Record credential update
  recordCredentialUpdate(user.id, 'username');
  
  return { success: true };
};

// Record credential updates for security audit
export const recordCredentialUpdate = (userId: string, type: 'username' | 'password'): void => {
  const updates = getCredentialUpdates();
  const update = {
    id: Date.now().toString(),
    userId,
    type,
    timestamp: new Date().toISOString(),
    ipAddress: 'localhost',
    userAgent: navigator.userAgent
  };
  
  updates.push(update);
  
  // Keep only last 50 updates
  if (updates.length > 50) {
    updates.splice(0, updates.length - 50);
  }
  
  localStorage.setItem(getTenantStorageKey('beauty-salon-credential-updates'), JSON.stringify(updates));
};

export const getCredentialUpdates = () => {
  const stored = localStorage.getItem(getTenantStorageKey('beauty-salon-credential-updates'));
  return stored ? JSON.parse(stored) : [];
};

// Get last credential update
export const getLastCredentialUpdate = (userId: string): { username?: string; password?: string } => {
  const updates = getCredentialUpdates();
  const userUpdates = updates.filter((update: any) => update.userId === userId);
  
  const lastUsernameUpdate = userUpdates
    .filter((update: any) => update.type === 'username')
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
  const lastPasswordUpdate = userUpdates
    .filter((update: any) => update.type === 'password')
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  
  return {
    username: lastUsernameUpdate?.timestamp,
    password: lastPasswordUpdate?.timestamp
  };
};
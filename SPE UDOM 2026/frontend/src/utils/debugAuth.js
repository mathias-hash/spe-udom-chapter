/**
 * Debug Authentication Issues
 * 
 * Use this helper to troubleshoot JWT authentication problems
 */

// 1. Check if tokens are being stored
export const debugTokenStorage = () => {
  const access = localStorage.getItem('spe_access');
  const refresh = localStorage.getItem('spe_refresh');
  const user = localStorage.getItem('spe_user');
  
  console.log('=== Token Storage Debug ===');
  console.log('Access Token:', access ? `✓ ${access.substring(0, 20)}...` : '✗ Not found');
  console.log('Refresh Token:', refresh ? `✓ ${refresh.substring(0, 20)}...` : '✗ Not found');
  console.log('User Data:', user ? `✓ ${JSON.parse(user).email}` : '✗ Not found');
  
  return { access, refresh, user };
};

// 2. Decode JWT token to see what's inside
export const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token Payload:', payload);
    console.log('Token Expires:', new Date(payload.exp * 1000));
    console.log('Token User ID:', payload.user_id);
    return payload;
  } catch (e) {
    console.error('Failed to decode token:', e.message);
    return null;
  }
};

// 3. Test login and token storage
export const debugLogin = async (email, password) => {
  console.log('=== Testing Login ===');
  
  try {
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok && data.tokens) {
      console.log('✓ Login successful');
      console.log('Access Token:', data.tokens.access ? '✓ Received' : '✗ Missing');
      console.log('Refresh Token:', data.tokens.refresh ? '✓ Received' : '✗ Missing');
      
      // Decode the tokens
      console.log('\n--- Access Token Decoded ---');
      decodeToken(data.tokens.access);
      
      return data;
    } else {
      console.log('✗ Login failed:', data);
      return null;
    }
  } catch (e) {
    console.error('✗ Login error:', e.message);
    return null;
  }
};

// 4. Test authenticated request
export const debugAuthenticatedRequest = async () => {
  console.log('=== Testing Authenticated Request ===');
  
  const token = localStorage.getItem('spe_access');
  if (!token) {
    console.error('✗ No access token found');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8000/api/auth/profile/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✓ Authenticated request successful');
    } else if (response.status === 401) {
      console.error('✗ Token invalid or expired (401 Unauthorized)');
    } else {
      console.error('✗ Request failed:', data);
    }
    
    return response.ok;
  } catch (e) {
    console.error('✗ Request error:', e.message);
    return false;
  }
};

// 5. Test with the secure API helper
export const debugSecureApi = async () => {
  console.log('=== Testing Secure API Helper ===');
  
  try {
    const { api } = await import('./api.js');
    const response = await api('/auth/profile/');
    
    console.log('Response:', response);
    if (response.ok) {
      console.log('✓ Secure API request successful');
    } else {
      console.log('✗ Secure API request failed:', response.data);
    }
  } catch (e) {
    console.error('✗ Secure API error:', e.message);
  }
};

// 6. Check CORS setup
export const debugCORS = async () => {
  console.log('=== Testing CORS ===');
  
  try {
    const response = await fetch('http://localhost:8000/', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
      },
    });
    
    console.log('CORS Headers from backend:');
    console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Credentials:', response.headers.get('Access-Control-Allow-Credentials'));
    console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    
  } catch (e) {
    console.error('✗ CORS check error:', e.message);
  }
};

// Run all debug tests
export const runAllDebugTests = async () => {
  console.clear();
  console.log('╔════════════════════════════════════════╗');
  console.log('║  SPE UDOM Authentication Debug Suite   ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  debugTokenStorage();
  console.log('\n');
  
  await debugCORS();
  console.log('\n');
  
  // Test login (replace with actual credentials)
  // await debugLogin('admin@speudom.ac.tz', 'AdminPass@123456');
  // console.log('\n');
  
  // If already logged in, test authenticated request
  if (localStorage.getItem('spe_access')) {
    await debugAuthenticatedRequest();
    console.log('\n');
    await debugSecureApi();
  }
  
  console.log('\n✓ Debug tests complete');
};

// Export for console use
window.debugAuth = {
  storage: debugTokenStorage,
  decode: decodeToken,
  login: debugLogin,
  authenticated: debugAuthenticatedRequest,
  secureApi: debugSecureApi,
  cors: debugCORS,
  runAll: runAllDebugTests,
};

console.log('✓ Auth debug helpers loaded. Use window.debugAuth.runAll() to run all tests');

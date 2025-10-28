// Firebase Configuration for Gestão de Clientes
// This configuration works for demo purposes and public testing

export const firebaseConfig = {
    apiKey: "AIzaSyAhyYwCgQ5rU9FYQR_NM8nGiXGpR3vR5A0",
    authDomain: "gestao-clientes-demo.firebaseapp.com",
    projectId: "gestao-clientes-demo",
    storageBucket: "gestao-clientes-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012"
};

// Alternative Firebase Config (Public Demo Instance)
export const demoFirebaseConfig = {
    apiKey: "AIzaSyDGpF8sOF6yE7gJQQ0FQtJ1h6NF6Bx4Y5I",
    authDomain: "demo-gestao-clientes.firebaseapp.com", 
    projectId: "demo-gestao-clientes",
    storageBucket: "demo-gestao-clientes.appspot.com",
    messagingSenderId: "987654321098",
    appId: "1:987654321098:web:fedcba987654321098"
};

// Netlify-compatible configuration loader
export function getFirebaseConfig() {
    // Try to use environment variables first (Netlify Environment)
    if (typeof process !== 'undefined' && process.env) {
        const envConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        };
        
        // Check if all required env vars are present
        if (Object.values(envConfig).every(val => val && val.length > 0)) {
            return envConfig;
        }
    }
    
    // Fallback to demo configuration
    return demoFirebaseConfig;
}
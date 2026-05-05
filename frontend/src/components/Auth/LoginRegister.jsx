import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LoginRegister.css'; // Let's assume you'll create a simple CSS file or reuse existing classes

function LoginRegister({ onBackToHome }) {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        const action = isLogin ? login : register;
        setSubmitting(true);
        const result = await action(email, password);
        setSubmitting(false);
        
        if (!result.success) {
            setError(result.error || 'Authentication failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {onBackToHome && (
                    <button 
                        type="button" 
                        className="btn--link" 
                        onClick={onBackToHome}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}
                    >
                        ← Back to Home
                    </button>
                )}
                <h1 className="auth-title">FitFlow</h1>
                <p className="auth-subtitle">
                    {isLogin ? 'Log in to your digital closet' : 'Create your digital closet'}
                </p>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="input-group">
                        <label className="label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn--primary auth-btn" disabled={submitting}>
                        {submitting ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>
                
                <p className="auth-switch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        type="button" 
                        className="btn--link"
                        onClick={() => setIsLogin(!isLogin)}
                        disabled={submitting}
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default LoginRegister;

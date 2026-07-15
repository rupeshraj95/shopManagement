import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controlled component input and error states
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback target route landing redirection parameters
  const fallbackDestination = location.state?.from?.pathname || '/billing';

  /**
   * Runs local conditional checks on values before sending network queries
   * @param {string} name 
   * @param {string} value 
   */
  const executeFieldValidation = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Operator email access key is required.';
      const emailSyntaxRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailSyntaxRegex.test(value)) return 'Please provide a valid email format signature.';
    }
    
    if (name === 'password') {
      if (!value) return 'Terminal security pass-key is required.';
      if (value.length < 6) return 'Password parameters must be 6 or more characters.';
    }
    
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Immediate validation response loop
    setErrors(prev => ({ ...prev, [name]: executeFieldValidation(name, value) }));
    
    // Clear layout server errors when typing resumes
    if (serverError) setServerError('');
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();

    // Final security firewall evaluation checkpoint
    const emailValidationResult = executeFieldValidation('email', formData.email);
    const passwordValidationResult = executeFieldValidation('password', formData.password);

    if (emailValidationResult || passwordValidationResult) {
      setErrors({ email: emailValidationResult, password: passwordValidationResult });
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    // Trigger global login auth method
    const authResult = await login(formData.email, formData.password);

    if (authResult.success) {
      if (authResult.token) {
        localStorage.setItem('token', authResult.token);
      }
      navigate(fallbackDestination, { replace: true });
    } else {
      setServerError(authResult.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex flex-col justify-center items-center px-4 font-sans antialiased">
      <div className="w-full sm:max-w-md space-y-5">
        
        {/* Minimal Typography Workspace Header */}
        <div className="text-center space-y-1">
          <h1 className="text-lg font-black tracking-widest text-zinc-950 uppercase">
            ABHISHEK TRADING - Sign-In
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Terminal Administration Gateway Access
          </p>
        </div>

        {/* Minimal Floating Panel Layout Element */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-5 shadow-2xs animate-fadeIn">
          
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-fadeIn">
              ⚠️ {serverError}
            </div>
          )}

          <form onSubmit={handleFormSubmission} className="space-y-4" noValidate>
            
            <InputField
              label="Store Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="operator@shop.com"
              error={errors.email}
              autoComplete="email"
              disabled={isSubmitting}
            />

            <InputField
              label="Terminal Access Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              error={errors.password}
              autoComplete="current-password"
              disabled={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 mt-2 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 text-xs font-bold tracking-wide uppercase rounded-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed select-none shadow-xs"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Verifying Session Handshake...</span>
                </div>
              ) : (
                'Open Terminal Session'
              )}
            </button>

          </form>
        </div>

        {/* Console Environment Security Footer */}
        <div className="text-center">
          <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase select-none">
            Protected Console Security Layer
          </span>
        </div>

      </div>
    </div>
  );
};

export default Login;
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../../utils";
import { Loading } from "../Loading";

import { useAuth } from "../../context/AuthContext";

import { Assets } from "@/assets";
import { Trans, useTranslation } from "react-i18next";
import { validateEmail } from "@/utils/validators";
import { handleAuthError } from "@/utils/errorHandler";
import { signIn, signUp } from "./service/authService";
import { X, Eye, EyeOff } from "lucide-react";

interface AuthProps {
  mode: "signIn" | "signUp" | null;
  onClose: () => void;
}

const Auth: React.FC<AuthProps> = ({ mode: initialMode, onClose }) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const { authenticate } = useAuth();
  const { t } = useTranslation();

  const [mode, setMode] = useState<"signIn" | "signUp">(initialMode || "signIn");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isLoading, setIsHandling] = useState<boolean>(false);

  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const [rememberMe, setRememberMe] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  const isSignIn = () => mode === "signIn";

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleCheckboxChange = () => {
    setRememberMe(!rememberMe);
  };

  const handleSwitchMode = () => {
    setMode((prevMode) => (prevMode === "signIn" ? "signUp" : "signIn"));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      showToast("error", "Username is required");
      usernameInputRef.current?.focus();
      return;
    }

    if (!trimmedPassword) {
      showToast("error", "Password is required");
      passwordInputRef.current?.focus();
      return;
    }

    if (mode === "signUp" && !validateEmail(trimmedEmail)) {
      setEmailError("Invalid email format");
      emailInputRef.current?.focus();
      return;
    }

    setEmailError("");
    setUsername(trimmedUsername);
    setPassword(trimmedPassword);
    if (mode === "signUp") {
      setEmail(trimmedEmail);
    }

    setIsHandling(true);

    try {
      const response = isSignIn()
        ? await signIn({ username: trimmedUsername, password: trimmedPassword })
        : await signUp({
          "email": trimmedEmail,
          "username": trimmedUsername,
          "password": trimmedPassword
        });

      if (response) {
        const { token, user } = response;
        authenticate(token, user);

        onClose();
        showToast("success", isSignIn() ? "Login successful!" : "Sign Up successful!");
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsHandling(false);
    }
  };

  const handleUsernameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      passwordInputRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    setMode(initialMode || "signIn");
  }, [initialMode]);

  return (
    <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">

      <div
        ref={popupRef}
        className="relative max-w-[32rem] w-full mx-auto p-8 md:p-10 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 shadow-2xl"
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-300 font-light">Loading...</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`${isLoading ? "pointer-events-none opacity-60" : ""} transition-opacity duration-300`}>
          <h2 className="text-center mb-10 text-white text-4xl md:text-5xl font-light tracking-tight">
            {isSignIn() ? (
              <>
                Welcome <span className="text-cyan-400">Back</span>
              </>
            ) : (
              'Create Account'
            )}
          </h2>

          <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
            {!isSignIn() && (
              <div className="group">
                <input
                  className="w-full bg-gray-800/30 border border-gray-700/50 text-white placeholder:text-gray-500 rounded-2xl px-6 py-4 font-light focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  ref={emailInputRef}
                  required
                />
                {emailError && (
                  <p className="text-red-400 text-sm mt-2 font-light">{emailError}</p>
                )}
              </div>
            )}

            <div className="group">
              <input
                className="w-full bg-gray-800/30 border border-gray-700/50 text-white placeholder:text-gray-500 rounded-2xl px-6 py-4 font-light focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                type="text"
                placeholder="Username"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleUsernameKeyDown}
                ref={usernameInputRef}
                required
              />
            </div>

            <div className="relative group">
              <input
                className="w-full bg-gray-800/30 border border-gray-700/50 text-white placeholder:text-gray-500 rounded-2xl px-6 py-4 pr-14 font-light focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                ref={passwordInputRef}
                required
              />
              <button
                type="button"
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {isSignIn() && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800/30 text-cyan-400 focus:ring-2 focus:ring-cyan-400/20 cursor-pointer"
                    checked={rememberMe}
                    onChange={handleCheckboxChange}
                  />
                  <span className="text-gray-400 text-sm font-light group-hover:text-gray-300 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-cyan-400 font-light transition-colors duration-300"
                >
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-4 px-8 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl font-light text-lg hover:from-cyan-400 hover:to-cyan-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignIn() ? 'Sign In' : 'Sign Up'}
            </button>

            <div className="flex items-center gap-4 py-6">
              <div className="h-px bg-gray-800 flex-1" />
              <span className="text-gray-500 text-sm font-light">
                or {isSignIn() ? 'sign in' : 'sign up'} with
              </span>
              <div className="h-px bg-gray-800 flex-1" />
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-cyan-400/50 hover:bg-gray-800/50 transition-all duration-300 group"
                aria-label="Sign in with Apple"
              >
                <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-cyan-400/50 hover:bg-gray-800/50 transition-all duration-300 group"
                aria-label="Sign in with Google"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
            </div>
          </form>

          <p className="text-center mt-8 text-gray-400 font-light">
            {isSignIn() ? (
              <>
                Don't have an account?{' '}
                <a
                  href="#"
                  onClick={handleSwitchMode}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 underline underline-offset-4"
                >
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <a
                  href="#"
                  onClick={handleSwitchMode}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 underline underline-offset-4"
                >
                  Sign in
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

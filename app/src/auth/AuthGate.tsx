import { useEffect, useState } from "react";
import { Lock, Mail, User, ArrowRight } from "lucide-react";

import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!session) return <SignIn />;

  return <>{children}</>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"in"|"up">("in");
  const [msg, setMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handle() {
    setMsg(null);
    setIsLoading(true);
    
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
        setMsg("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      }
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handle();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/padelzonelogo.svg" 
              alt="Padel Zone" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Padel Zone
          </h1>
          <p className="text-gray-600">
            Tournament management made simple
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-gray-900">
              {mode === "up" ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {mode === "up" 
                ? "Join the Padel Zone community" 
                : "Access your tournaments and players"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handle} 
              disabled={isLoading || !email || !pw}
              className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {mode === "up" ? (
                    <>
                      <User className="h-4 w-4" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Sign In
                    </>
                  )}
                </>
              )}
            </Button>

            {/* Mode Toggle */}
            <div className="text-center pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => setMode(mode === "in" ? "up" : "in")}
                className="text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 transition-colors duration-200"
              >
                {mode === "in" 
                  ? "Don't have an account? Create one" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>

            {/* Error/Success Message */}
            {msg && (
              <div className={`p-3 rounded-lg text-sm text-center ${
                msg.includes("Check your email") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {msg}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Streamline your padel tournaments with professional-grade tools
        </div>
      </div>
    </div>
  );
}

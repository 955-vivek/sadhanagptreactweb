import React from 'react';
// import { useNavigate } from 'react-router-dom';

const GoogleButton = () => {
   // const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGoogleLogin = () => {
        setIsLoading(true);

        // 👉 Redirect to backend (dummy or real)
        
        window.location.href = import.meta.env.VITE_GOOGLE_AUTH_URL;// "https://desktop-4ntjhpk.tail18c2a1.ts.net/auth/google";
        // replace with your backend URL if different
    };

    return (
        <div className="w-full max-w-[340px] flex flex-col items-center gap-3">
            
            <button
                onClick={handleGoogleLogin}
                className="w-full bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-[#475569] dark:text-[#F8FAFC] rounded-full py-2 px-4 flex items-center justify-center gap-2 shadow-sm hover:shadow-md dark:hover:bg-[#334155] transition-all duration-300"
            >
                <img 
                    src="https://developers.google.com/identity/images/g-logo.png" 
                    alt="Google" 
                    className="w-5 h-5"
                />
                Continue with Google
            </button>

            {isLoading && (
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium animate-pulse">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Redirecting...
                </div>
            )}
        </div>
    );
};

export default GoogleButton;
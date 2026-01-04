"use client";

interface WelcomeLogoProps {
  size?: number;
}

export function WelcomeLogo({ size = 64 }: WelcomeLogoProps) {
  return (
    <div 
      className="flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl text-white font-bold shadow-lg"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      AI
    </div>
  );
}

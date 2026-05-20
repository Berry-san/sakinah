'use client';

export function FloatingLights() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 bg-background"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 90% 40% at 50% 0%, hsl(38 58% 52% / 0.07) 0%, transparent 70%),
          radial-gradient(ellipse 60% 30% at 80% 100%, hsl(30 20% 12% / 0.6) 0%, transparent 70%)
        `
      }}
    />
  );
}

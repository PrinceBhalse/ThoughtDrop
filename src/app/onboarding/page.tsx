import { completeProfile } from "./actions";

export default function OnboardingPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="glass-panel max-w-md w-full p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Complete Profile</h1>
          <p className="text-muted-foreground">Almost there! We need a few more details.</p>
        </div>

        <form action={completeProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="e.g. thought_leader"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="dob">Date of Birth</label>
            <input 
              type="date" 
              id="dob" 
              name="dob" 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all color-scheme-dark"
            />
            <p className="text-xs text-muted-foreground mt-2">Required for accessing 18+ content. Your age is not shown publicly.</p>
          </div>

          <button type="submit" className="w-full primary-button py-3 text-lg mt-6">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}

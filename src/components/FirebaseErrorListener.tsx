'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, X, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A central listener that displays rich, contextual error information
 * when Firestore Security Rules deny a request.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handlePermissionError = (err: FirestorePermissionError) => {
      setError(err);
      // Auto-clear after 15 seconds to keep the UI clean
      setTimeout(() => setError(null), 15000);
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => errorEmitter.off('permission-error', handlePermissionError);
  }, []);

  if (!error) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-md animate-in slide-in-from-right-8 duration-500">
      <Alert className="bg-[#0c0c0e] text-white border-2 border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-[2rem] p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <ShieldAlert className="h-5 w-5 text-primary" />
              </div>
              <AlertTitle className="text-sm font-black uppercase italic tracking-tighter">Security Alert</AlertTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white" 
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <AlertDescription className="space-y-6">
            <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol</span>
                <span className="text-[10px] font-mono font-bold text-primary">{error.request.method.toUpperCase()}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Path</span>
                <code className="block text-[9px] font-mono break-all text-slate-400 bg-black/40 p-3 rounded-lg border border-white/5">
                  {error.request.path}
                </code>
              </div>
            </div>

            <div className="flex items-start gap-4">
               <Fingerprint className="h-5 w-5 text-accent shrink-0 mt-1" />
               <p className="text-[10px] leading-relaxed font-bold text-slate-300">
                Identity synchronization failed for this node. If you are an authorized administrator, ensure your signature is registered in the <code className="text-primary">roles_admin</code> registry or matches the master authority UID.
               </p>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}

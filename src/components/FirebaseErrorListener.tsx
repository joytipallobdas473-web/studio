'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, X } from 'lucide-react';
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
    <div className="fixed bottom-4 right-4 z-[100] max-w-md animate-in slide-in-from-right-4">
      <Alert variant="destructive" className="bg-destructive text-destructive-foreground border-2 border-white shadow-2xl">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="flex justify-between items-center font-bold">
          Security Permission Denied
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0 hover:bg-white/20 text-white" 
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-3 text-xs leading-relaxed">
          <div className="space-y-1 bg-black/10 p-2 rounded mb-2">
            <p><strong>Operation:</strong> {error.request.method.toUpperCase()}</p>
            <p><strong>Path:</strong> <code className="break-all">{error.request.path}</code></p>
          </div>
          <p className="opacity-90">
            This action was blocked by Firestore Security Rules. If you are an admin, ensure your UID is registered in the <code>roles_admin</code> collection.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
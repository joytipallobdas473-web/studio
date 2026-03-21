
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handlePermissionError = (err: FirestorePermissionError) => {
      setError(err);
      // Auto-clear after 10 seconds
      setTimeout(() => setError(null), 10000);
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => errorEmitter.off('permission-error', handlePermissionError);
  }, []);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-md animate-in slide-in-from-right-4">
      <Alert variant="destructive" className="bg-destructive text-destructive-foreground">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="flex justify-between items-center">
          Security Permission Denied
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 hover:bg-transparent" 
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2 text-xs">
          <p>Operation: <strong>{error.context.operation}</strong></p>
          <p>Path: <code>{error.context.path}</code></p>
          <p className="mt-1 opacity-80">This action was blocked by Firestore Security Rules. Ensure you have the correct administrative permissions.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface AuthCardWrapperProps {
  children: ReactNode;
  headerTitle: string;
  headerLabel: string;
  backButtonLabel?: string;
  backButtonHref?: string;
  showSocial?: boolean;
}

export const AuthCardWrapper = ({
  children,
  headerTitle,
  headerLabel,
}: AuthCardWrapperProps) => {
  return (
    <Card className="w-full max-w-[400px] shadow-lg border-t-4 border-t-primary bg-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline font-bold text-primary">{headerTitle}</CardTitle>
        <CardDescription className="text-muted-foreground font-body">
          {headerLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

'use client';
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

interface TwoFactorCardProps {
  twoFactorEnabled: boolean;
  setValue: (name: string, value: any, options?: any) => void;
  isLoading: boolean;
}

const TwoFactorCard: React.FC<TwoFactorCardProps> = ({
  twoFactorEnabled,
  setValue,
  isLoading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentification à Deux Facteurs (2FA)</CardTitle>
        <CardDescription>
          Ajoutez une couche de sécurité supplémentaire à votre compte. Un code vous sera envoyé par e-mail lors de la connexion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <Label htmlFor="2fa-switch" className="flex items-center gap-3 cursor-pointer">
            <ShieldCheck size={20} className="text-primary" />
            <span className="font-medium">Activer la vérification en deux étapes</span>
          </Label>
          <Switch
            id="2fa-switch"
            checked={twoFactorEnabled}
            onCheckedChange={(checked) => setValue('twoFactorEnabled', checked, { shouldDirty: true })}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorCard;

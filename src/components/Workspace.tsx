// src/components/Workspace.tsx
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";

export function Workspace() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Espace de travail</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <Textarea
          placeholder="Écrivez vos notes ici..."
          className="w-full h-full resize-none"
        />
      </CardContent>
    </Card>
  );
}

// src/components/dashboard/admin/AdminHeader.tsx
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Settings } from "lucide-react";
import DateButton from './DateButton';

const AdminHeader = () => {
  console.log("👑 [AdminHeader] Rendu du composant.");
  const formattedDate = format(new Date(), "EEEE, dd MMMM yyyy", { locale: fr });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center">
          <Settings className="mr-3 h-8 w-8" />
          Panneau d'Administration
        </h1>
        <p className="text-lg text-muted-foreground mt-1">
          Gérez les paramètres avancés et les outils de planification.
        </p>
      </div>
      <DateButton dateString={capitalizedDate} />
    </div>
  );
};

export default AdminHeader;

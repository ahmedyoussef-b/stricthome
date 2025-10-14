// src/components/Menu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from './Menu.module.css';
import type { Role, Classroom } from '@prisma/client';
import { menuItems } from '@/lib/constants'; // Import centralized menu items
import type { User } from 'next-auth';

interface MenuProps {
  user: User;
  classrooms?: Pick<Classroom, 'id' | 'nom'>[];
  validationCount?: number;
}

const Menu: React.FC<MenuProps> = ({ user, classrooms = [], validationCount = 0 }) => {
  const pathname = usePathname();

  const colorClasses = [
    styles.red,
    styles.green,
    styles.blue,
    styles.purple,
  ];

  return (
    <div className="p-4 text-sm h-full overflow-y-auto">
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="remove-black-button-13" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 0 1" result="black-pixels"></feColorMatrix>
          <feComposite in="SourceGraphic" in2="black-pixels" operator="out"></feComposite>
        </filter>
      </svg>
      
      {menuItems.map((group) => {
        // Filter items based on user role
        const visibleItems = group.items.filter(item => item.roles.includes(user.role as Role));
        if (visibleItems.length === 0) return null;
        
        return (
          <div className="flex flex-col gap-1 mb-4" key={group.title}>
            <div className={styles.titleFrame}>
              <span className={styles.titleBackground}></span>
              <span className={styles.titleBorder}></span>
              <span className={styles.titleText}>{group.title}</span>
            </div>

            {visibleItems.map((item, index) => {
              const colorClass = colorClasses[index % colorClasses.length];
              
              if (item.component) {
                 const Comp = item.component as React.ElementType;
                 // Pass necessary props to dynamic components
                 const compProps = item.label === "Créer une Annonce" ? { classrooms } : {};
                 return (
                    <div key={item.label} className={cn(styles.button, colorClass, "justify-center")}>
                       <Comp {...compProps} />
                    </div>
                 )
              }
              
              if(item.href) {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    href={item.href}
                    key={item.label}
                    className={cn(styles.button, colorClass, isActive && "ring-2 ring-accent")}
                  >
                    <Icon />
                    <span>{item.label}</span>
                    {item.label === 'Validations' && validationCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">{validationCount}</span>
                    )}
                  </Link>
                );
              }
              return null;
            })}
          </div>
        )
      })}
    </div>
  );
};

export default Menu;

// src/components/Menu.tsx
"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/lib/redux/slices/authSlice";
import type { SafeUser, Role } from "@/types";
import { menuItems } from "@/lib/constants"; 
import { cn } from "@/lib/utils";
import styles from './Menu.module.css';

interface MenuProps {
  role: Role | null | undefined;
}

const Menu: React.FC<MenuProps> = ({ role }) => {
  const currentUser: SafeUser | null = useSelector(selectCurrentUser);
  const userRole = currentUser?.role;

  if (!userRole) {
    return null;
  }

  const colorClasses = [
    styles.red,
    styles.green,
    styles.blue,
    styles.purple,
  ];

  return (
    <div className="p-6 text-sm h-full overflow-y-auto">
      {/* This SVG is for the fallback filter used in the title border style */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="remove-black-button-13" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    -1 -1 -1 0 1" result="black-pixels"></feColorMatrix>
          <feComposite in="SourceGraphic" in2="black-pixels" operator="out"></feComposite>
        </filter>
      </svg>

      {menuItems.map((group) => (
        <div className="flex flex-col gap-1 mb-4" key={group.title}>
          <div className={styles.titleFrame}>
            <span className={styles.titleBackground}></span>
            <span className={styles.titleBorder}></span>
            <span className={styles.titleText}>{group.title}</span>
          </div>

          {group.items.map((item, index) => {
            if (item.visible.includes(userRole)) {
              // The home link always points to the role-specific dashboard page
              const finalHref = item.href === "/accueil" ? `/${userRole.toLowerCase()}` : item.href;
              const IconComponent = item.icon;
              
              return (
                <Link
                  href={finalHref} 
                  key={item.label}
                  className={cn(
                    styles.button,
                    colorClasses[index % colorClasses.length]
                  )}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;

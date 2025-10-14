// components/DynamicAvatar.jsx
'use client';
import Image from 'next/image';
import React from 'react';
import { cn } from "@/lib/utils";

/**
 * A component to display a user's avatar, falling back to a placeholder image from DiceBear.
 * @param {{
 *  seed?: string | null;
 *  imageUrl?: string | null;
 *  alt?: string;
 *  className?: string;
 *  isLCP?: boolean;
 * }} props
 */
const DynamicAvatar = ({ 
  seed = null, 
  imageUrl = null, 
  alt = "User avatar", 
  className = '', 
  isLCP = false 
}) => {
  
  const finalSeed = seed || 'default-avatar-seed';
  const finalImageUrl = imageUrl || `https://api.dicebear.com/8.x/bottts/svg?seed=${finalSeed}`;
  const hint = imageUrl ? {} : { 'data-ai-hint': 'avatar portrait' };

  return (
    <Image
      src={finalImageUrl}
      alt={alt}
      fill
      sizes="(max-width: 768px) 50vw, 33vw"
      className={cn('object-cover object-top', className)}
      priority={isLCP}
      {...hint}
    />
  );
}

export default DynamicAvatar;

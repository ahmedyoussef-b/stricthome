
"use client";

import { Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from 'use-debounce';

const TableSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [text, setText] = useState(searchParams.get('search') || '');
  const [query] = useDebounce(text, 500);

  useEffect(() => {
    // Only push router if the query has actually changed from what's in the URL
    if (query !== (searchParams.get('search') || '')) {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      // Reset to first page on search
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [query, pathname, router, searchParams]);


  return (
    <div
      className="w-full md:w-auto flex items-center gap-2 text-sm rounded-full ring-1 ring-border px-3 bg-card"
    >
      <Search className="text-muted-foreground" size={16} />
      <input
        type="text"
        placeholder="Rechercher..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-[200px] p-2 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
};

export default TableSearch;

"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CreatorLinkProps {
  creator: string;
}

export default function CreatorLink({ creator }: CreatorLinkProps) {
  const router = useRouter();
  
  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/home/viewuser/${creator}`);
  };

  return (
    <span 
      className="text-blue-400 hover:underline ml-1 cursor-pointer"
      onClick={handleCreatorClick}
    >
      {creator}
    </span>
  );
}

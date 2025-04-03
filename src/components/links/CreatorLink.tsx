"use client";

import { useRouter } from 'next/navigation';

interface CreatorLinkProps {
  creator: string;
  color?: string;
}

export default function CreatorLink({ creator, color }: CreatorLinkProps) {
  const router = useRouter();
  
  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/home/viewuser/${creator}`);
  };

  return (
    <span 
      className={`${color === 'white' ? 'text-white hover:text-blue-400 transition' : 'text-blue-400'} hover:underline  cursor-pointer`}
      onClick={handleCreatorClick}
    >
      {creator}
    </span>
  );
}

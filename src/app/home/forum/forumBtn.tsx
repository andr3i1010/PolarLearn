"use client";
import Button1 from "@/components/button/Button1";

export default function ForumBtn({ onClick }: { onClick?: () => void }) {
  return (
    <Button1 
      text="Nieuwe post" 
      onClick={() => { 
        onClick?.(); 
      }}
    />
  );
}
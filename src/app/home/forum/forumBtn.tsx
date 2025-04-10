"use client";
import { memo } from 'react';
import Button1 from "@/components/button/Button1";

function ForumBtn({ onClick }: { onClick?: () => void }) {
  return (
    <Button1
      text="Nieuwe post"
      onClick={onClick}
    />
  );
}

export default memo(ForumBtn);
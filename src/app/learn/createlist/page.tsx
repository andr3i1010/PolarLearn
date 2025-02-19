"use client"
import CreateListTool from "@/components/learning/createList";

export default function CreateListPage() {
  return (
    <div className="mx-2">
      <div className="text-center">
        <h1 className="text-4xl pt-4 font-extrabold">Nieuwe Lijst</h1>
      </div>
      <CreateListTool />
    </div>
  );
}
"use client";
import { LetterText, List, MessageCircle, Plus, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Link from "next/link";
import GroupDialog from "@/app/learn/groups/groupDialog";
import ForumCreateDialog from "@/components/forum/ForumDialog";
import { useGroupCreation } from "@/hooks/useGroupCreation";
import { useForumCreation } from "@/hooks/useForumCreation";
import { memo, useRef, useState, useEffect } from "react";

const MobileDropdown = memo(
  ({
    text,
    dropdownMatrix,
    dropdownMatrix2,
    isOpen,
    onToggle,
  }: {
    text: string;
    dropdownMatrix: [React.ReactNode, string][];
    dropdownMatrix2: [React.ReactNode, () => void][];

    isOpen: boolean;
    onToggle: () => void;

  }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownHeight, setDropdownHeight] = useState<number>(0);

    useEffect(() => {
      if (dropdownRef.current) {
        setDropdownHeight(dropdownRef.current.scrollHeight);
      }
    }, [isOpen]);

    return (
      <div
        className={`inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg w-full mb-3`}
      >
        <div
          className={`rounded-lg border-4 border-neutral-700 duration-300 ${isOpen ? "hover:border-transparent" : ""
            }`}
          style={{
            height: isOpen ? `${48 + dropdownHeight}px` : "48px",
            backgroundColor: isOpen ? "transparent" : "#262626",
          }}
        >
          <button
            type="button"
            className="w-full bg-neutral-800 text-white font-bold py-2 px-4 rounded-t-md flex justify-between items-center"
            onClick={onToggle}
          >
            <span>{text}</span>
            <span
              className="transition-transform duration-300"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▼
            </span>
          </button>

          <div
            ref={dropdownRef}
            className={`overflow-hidden transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0"
              } shadow-lg`}
            style={{
              height: isOpen ? `${dropdownHeight}px` : "0px",
              backgroundColor: "#262626",
              margin: "0 auto",
              transition: "height 0.3s ease, opacity 0.3s ease",
            }}
          >
            {dropdownMatrix.map(([display, path], index) => (
              <Link
                key={index}
                href={path as string}
                className="block px-4 py-2 text-white hover:bg-sky-500 transition-colors duration-200"
              >
                {display}
              </Link>
            ))}
            {dropdownMatrix2.map(([display, click], index) => (
              <button
                key={index}
                onClick={click}
                className="block px-4 py-2 text-white hover:bg-sky-500 transition-colors duration-200 w-100"
              >
                {display}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

export default function PlusBtnMb() {
    const {
        dialogOpen: groupDialogOpen,
        isSubmitting: groupIsSubmitting,
        form: groupForm,
        handleOpenDialog: handleOpenGroupDialog,
        handleOpenChange: handleGroupOpenChange,
        onSubmit: groupOnSubmit
    } = useGroupCreation();

    const {
        dialogOpen: forumDialogOpen,
        isSubmitting: forumIsSubmitting,
        isAdmin,
        banned,
        form: forumForm,
        content,
        selectedCategory,
        handleOpenDialog: handleOpenForumDialog,
        handleOpenChange: handleForumOpenChange,
        onSubmit: forumOnSubmit
    } = useForumCreation();
    const [dropdown, setdropdown] = useState(false);
    const dropdownMatrixStart: [React.ReactNode, string][] = [
        [
            <div className="flex items-center">                       
            <List />
            Nieuwe Lijst
            </div>,
            "/learn/createlist",
        ],
        [
            <div className="flex items-center">                       
                        <LetterText />
                        Nieuwe Samenvatting
            </div>,
            "/learn/createsummary",
        ]
    ];
        const dropdownMatrixStart2: [React.ReactNode, () => void][] = [
        [
            <div className="flex items-center">                       
             <Users />
                Nieuwe Groep
            </div>,
            handleOpenGroupDialog,
        ],
        [
            <div className="flex items-center">                       
                <MessageCircle />
                Nieuwe Forumpost
            </div>,
            handleOpenForumDialog,
        ]
    ];
    return (
        <>
            <MobileDropdown
            text="Nieuwe"
            dropdownMatrix={dropdownMatrixStart}
            dropdownMatrix2={dropdownMatrixStart2}
            isOpen={dropdown}
            onToggle={()=>{setdropdown(!dropdown)}}
            />

            <GroupDialog
                dialogOpen={groupDialogOpen}
                handleOpenChange={handleGroupOpenChange}
                form={groupForm}
                onSubmit={groupOnSubmit}
                isSubmitting={groupIsSubmitting}
            />

            <ForumCreateDialog
                dialogOpen={forumDialogOpen}
                handleOpenChange={handleForumOpenChange}
                form={forumForm}
                onSubmit={forumOnSubmit}
                isSubmitting={forumIsSubmitting}
                isAdmin={isAdmin}
                banned={banned}
                content={content}
                selectedCategory={selectedCategory}
            />
        </>
    );
}
"use client"

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button1 from "@/components/button/Button1";
import { Upload, Trash, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface GroupPictureManagerProps {
  groupId: string;
  currentImage?: string | null;
  canEdit: boolean;
}

export default function GroupPictureManager({
  groupId,
  currentImage,
  canEdit
}: GroupPictureManagerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Alleen JPEG, PNG en WebP bestanden zijn toegestaan.");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Bestand is te groot. Maximum 5MB toegestaan.");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("groupPicture", selectedFile);

      const result = await fetch(`/api/v1/groups/${groupId}/picture`, {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      if (result.success) {
        toast.success(result.message);
        setImageUrl(result.imageUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error uploading group picture:", error);
      toast.error("Er is een fout opgetreden bij het uploaden van de groepsfoto.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await fetch(`/api/v1/groups/${groupId}/picture`, {
        method: "DELETE",
      }).then((res) => res.json());

      if (result.success) {
        toast.success(result.message);
        setImageUrl(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting group picture:", error);
      toast.error("Er is een fout opgetreden bij het verwijderen van de groepsfoto.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!canEdit) {
    return null; // Don't show the component if user can't edit
  }

  return (
    <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
      <CardHeader>
        <CardTitle>Groepsfoto</CardTitle>
        <CardDescription className="text-neutral-400">
          Upload een foto om je groep te personaliseren.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Group Picture */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-neutral-700 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Groepsfoto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-neutral-400 text-sm text-center">
                  Geen foto
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-neutral-300">
              {imageUrl ? "Huidige groepsfoto" : "Geen groepsfoto ingesteld"}
            </p>
            <p className="text-xs text-neutral-500">
              Ondersteunde formaten: JPEG, PNG, WebP (max 5MB)
            </p>
          </div>
        </div>

        {/* File Preview */}
        {previewUrl && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Voorvertoning"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-300">Voorvertoning nieuwe foto</p>
                <p className="text-xs text-neutral-500">{selectedFile?.name}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button1
                text={isUploading ? "Uploaden..." : "Uploaden"}
                onClick={handleUpload}
                disabled={isUploading}
                icon={
                  isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )
                }
              />
              <Button1
                text="Annuleren"
                onClick={handleCancelFileSelection}
                className="bg-neutral-600 hover:bg-neutral-500"
              />
            </div>
          </div>
        )}

        {/* Upload Actions */}
        <div className="flex space-x-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="sr-only"
            disabled={isUploading}
            ref={fileInputRef}
          />
          <Button1
            text="Foto selecteren"
            icon={<Upload className="w-4 h-4" />}
            disabled={isUploading}
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          />
          {imageUrl && (
            <Button1
              text={isDeleting ? "Verwijderen..." : "Foto verwijderen"}
              icon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
              onClick={handleDelete}
              disabled={isDeleting || isUploading}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Jdenticon from "@/components/Jdenticon";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Trash,
  AlertCircle,
  CircleCheck,
  Upload,
  X,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import Button1 from "@/components/button/Button1";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Preferences {
  streakReminders?: boolean;
  profileVisibility?: boolean;
}

interface InitialData {
  id: string;
  username: string | null;
  email: string | null;
  scheduledDeletion?: string | null;
  preferences?: Preferences;
  profilePicture?: string | null;
  botAccount?: { name: string | null; key: string | null } | null;
}

interface Props {
  initialData: InitialData;
}

export default function ClientAccountSettings({ initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userData, setUserData] = useState<InitialData>(initialData);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteLists, setDeleteLists] = useState(false);
  const [deleteForumPosts, setDeleteForumPosts] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bot API settings state
  const [botAccount, setBotAccount] = useState<{
    name: string | null;
    key: string | null;
  }>(initialData.botAccount || { name: null, key: null });
  const [deleteApiAgentOpen, setDeleteApiAgentOpen] = useState(false);
  const [createBotDialogOpen, setCreateBotDialogOpen] = useState(false);
  const [createBotLoading, setCreateBotLoading] = useState(false);
  const [botName, setBotName] = useState("");

  const handleSaveChanges = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await fetch("/api/v1/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          username: formData.get("username"),
          email: formData.get("email"),
        }),
      }).then((res) => res.json());

      if (result.success) {
        toast.success(result.message);
        setUserData((prev) => ({
          ...prev,
          username: formData.get("username") as string,
          email: formData.get("email") as string,
        }));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(
        "Er is een fout opgetreden bij het opslaan van je wijzigingen."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const currentPassword = formData.get("currentPassword");
      const newPassword = formData.get("newPassword");
      const confirmPassword = formData.get("confirmPassword");
      const result = await fetch("/api/v1/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password",
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      }).then((res) => res.json());

      if (result.success) {
        toast.success("Je wachtwoord is gewijzigd.");
      } else {
        toast.error(
          "Er is een fout opgetreden bij het wijzigen van je wachtwoord."
        );
      }
    } catch (err) {
      toast.error(
        "Er is een fout opgetreden bij het wijzigen van je wachtwoord."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

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
  const handleProfilePictureUpload = async () => {
    if (!selectedFile) return;

    setProfilePictureLoading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      const result = await fetch("/api/v1/settings/profile-picture", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      if (result.success) {
        toast.success(result.message);
        // Update cache buster to force fresh image loads
        const newCacheBuster = Date.now();

        // Use the URL returned from the server (which already includes cache busting)
        setUserData((prev) => ({
          ...prev,
          profilePicture: result.imageUrl,
        }));
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error(
        "Er is een fout opgetreden bij het uploaden van je profielfoto."
      );
    } finally {
      setProfilePictureLoading(false);
    }
  };
  const handleProfilePictureDelete = async () => {
    setProfilePictureLoading(true);
    try {
      const result = await fetch("/api/v1/settings/profile-picture", {
        method: "DELETE",
      }).then((res) => res.json());

      if (result.success) {
        toast.success(result.message);

        setUserData((prev) => ({
          ...prev,
          profilePicture: null,
        }));
      } else {
        toast.error(result.message);

        // If deletion failed, let's verify if the image still exists
        if (result.message.includes("geen profielfoto")) {
          // Server says no profile picture exists, update UI accordingly
          setUserData((prev) => ({
            ...prev,
            profilePicture: null,
          }));
        }
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      toast.error(
        "Er is een fout opgetreden bij het verwijderen van je profielfoto."
      );
    } finally {
      setProfilePictureLoading(false);
    }
  };

  const handleCancelFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleDeleteAccount = async () => {
    setDeleteDialogOpen(false);
    setDeleteLoading(true);

    try {
      const result = await fetch("/api/v1/settings/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteLists, deleteForumPosts }),
      }).then((res) => res.json());
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(
        "Er is een fout opgetreden bij het verwijderen van je account."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      const result = await fetch("/api/v1/settings/account", {
        method: "DELETE",
      }).then((res) => res.json());
      if (result.success) {
        toast.success(result.message);
        setUserData((prev) => ({ ...prev, scheduledDeletion: null }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        "Er is een fout opgetreden bij het annuleren van de verwijdering."
      );
    }
  };

  // Handle data export with 30-day cooldown
  const handleExportData = () => {
    setExportLoading(true);
    // Use toast.promise to handle pending, success, and error states
    const exportPromise = fetch("/api/v1/settings/export")
      .then((res) => res.json())
      .then(
        (result) =>
          new Promise<void>((resolve, reject) => {
            if (!result.success) {
              reject(new Error(result.message));
            } else {
              // Trigger file download
              const blob = new Blob([JSON.stringify(result.data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `polarlearn-export-${new Date().toISOString()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              resolve();
            }
          })
      );
    toast
      .promise(exportPromise, {
        pending: {
          render: "Data wordt geëxporteerd...",
          icon: <Loader2 className="animate-spin" />,
          style: {
            background: "linear-gradient(to right, #38bdf8, #e0f2fe)",
            color: "#fff",
          },
        },
        success: {
          render({ data }: { data: any }) {
            return `Je data is succesvol geëxporteerd!`;
          },
          icon: <CircleCheck />,
          style: {
            background: "#07bc0c",
            color: "#fff",
          },
        },
        error: {
          render({ data }: { data: Error }) {
            return (
              data.message ||
              "Er is een fout opgetreden bij het exporteren van je data."
            );
          },
          icon: <AlertCircle />,
          style: {
            background: "hsl(6, 78%, 57%)",
            color: "#fff",
          },
        },
      })
      .finally(() => {
        setExportLoading(false);
      });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Accountinstellingen</h1>

      <form onSubmit={handleSaveChanges}>
        <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
          <CardHeader>
            <CardTitle>Persoonlijke informatie</CardTitle>
            <CardDescription className="text-neutral-400">
              Update je persoonlijke gegevens en hoe je account wordt
              weergegeven.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Gebruikersnaam</Label>
              <Input
                id="username"
                name="username"
                placeholder="Je gebruikersnaam"
                defaultValue={userData.username || ""}
                className="bg-neutral-700 border-neutral-600 text-white"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Je e-mailadres"
                defaultValue={userData.email || ""}
                className="bg-neutral-700 border-neutral-600 text-white"
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button1
              text={loading ? "Bezig..." : "Opslaan"}
              type="submit"
              disabled={loading}
              icon={
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : undefined
              }
            />
          </CardFooter>
        </Card>
      </form>

      <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
        <CardHeader>
          <CardTitle>Profielfoto</CardTitle>
          <CardDescription className="text-neutral-400">
            Upload je profielfoto om je profiel te personaliseren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden">
                {userData.profilePicture ? (
                  <img
                    src={userData.profilePicture}
                    alt="Profielfoto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Jdenticon value={userData.username as string} size={80} />
                )}
              </div>
            </div>

            {/* Upload/Delete Buttons */}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {userData.profilePicture
                  ? "Huidige profielfoto"
                  : "Geen profielfoto"}
              </p>
              <p className="text-xs text-neutral-400">
                JPEG, PNG of WebP. Max 5MB.
              </p>
            </div>
          </div>

          {/* File Selection */}
          {selectedFile && (
            <div className="border border-neutral-600 rounded-lg p-4 bg-neutral-700">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-neutral-600 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Voorbeeld"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={handleCancelFileSelection}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button1
                  text={profilePictureLoading ? "Uploaden..." : "Uploaden"}
                  onClick={handleProfilePictureUpload}
                  disabled={profilePictureLoading}
                  icon={
                    profilePictureLoading ? (
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
              disabled={profilePictureLoading}
              ref={fileInputRef}
            />
            <Button1
              text="Foto selecteren"
              icon={<Upload className="w-4 h-4" />}
              disabled={profilePictureLoading}
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
            {userData.profilePicture && (
              <Button1
                text="Verwijderen"
                onClick={handleProfilePictureDelete}
                disabled={profilePictureLoading}
                icon={<Trash className="w-4 h-4" />}
                className="bg-red-600 hover:bg-red-500"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
        <CardHeader>
          <CardTitle>Wachtwoord wijzigen</CardTitle>
          <CardDescription className="text-neutral-400">
            Update je wachtwoord om je account veilig te houden.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-neutral-700 border-neutral-600 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-neutral-400 hover:text-white"
                >
                  {showCurrentPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-neutral-700 border-neutral-600 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-neutral-400 hover:text-white"
                >
                  {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-neutral-700 border-neutral-600 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-neutral-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button1
              text={passwordLoading ? "Bezig..." : "Wijzig wachtwoord"}
              type="submit"
              disabled={passwordLoading}
              icon={
                passwordLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : undefined
              }
              className="mt-4"
            />
          </CardFooter>
        </form>
      </Card>

      <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
        <CardHeader>
          <CardTitle>API instellingen</CardTitle>
          <CardDescription className="text-neutral-400">
            Beheer je API instellingen. Je kunt hier een bot voor de API account
            aanmaken of verwijderen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {botAccount.name ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="botAccount">Bot naam</Label>
                <Input
                  id="botAccount"
                  name="botAccount"
                  placeholder="Je bot account naam"
                  defaultValue={botAccount.name || ""}
                  className="bg-neutral-700 border-neutral-600 text-white"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  placeholder="Je API key"
                  defaultValue={botAccount.key || ""}
                  className="bg-neutral-700 border-neutral-600 text-white"
                  readOnly
                />
              </div>
              <Button1
                text="Bot verwijderen"
                onClick={() => setDeleteApiAgentOpen(true)}
                icon={<Trash className="h-4 w-4" />}
              />
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-400">
                Je hebt nog geen bot account. Maak een bot account aan om de API
                te kunnen gebruiken.
              </p>
              <Button1
                text="Bot account aanmaken"
                onClick={() => setCreateBotDialogOpen(true)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Bot Dialog */}
      <Dialog open={createBotDialogOpen} onOpenChange={setCreateBotDialogOpen}>
        <DialogContent className="bg-neutral-800 text-white border-neutral-700">
          <DialogHeader>
            <DialogTitle>Bot Account Aanmaken</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Maak een bot account aan om de API te kunnen gebruiken.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botName">Bot Naam</Label>
              <Input
                id="botName"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Geef je bot een naam"
                className="bg-neutral-700 border-neutral-600 text-white"
              />
            </div>

            <div className="bg-blue-900/30 border border-blue-700 rounded-md p-3">
              <p className="text-sm text-blue-300">
                Een bot account geeft je toegang tot onze publieke API. Je krijgt een
                unieke API sleutel die je kunt gebruiken om programmatisch
                toegang te krijgen tot onze diensten.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button1
              text="Annuleren"
              onClick={() => {
                setCreateBotDialogOpen(false);
                setBotName("");
              }}
            />
            <Button1
              text={createBotLoading ? "Bezig..." : "Bot Aanmaken"}
              disabled={!botName.trim() || createBotLoading}
              icon={
                createBotLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : undefined
              }
              onClick={async () => {
                setCreateBotLoading(true);
                try {
                  const result = await fetch("/api/v1/settings/bot-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: botName.trim() }),
                  }).then((res) => res.json());

                  if (result.success && result.botAccount) {
                    toast.success("Bot account succesvol aangemaakt!");
                    setBotAccount({
                      name: botName.trim(),
                      key: result.botAccount.key,
                    });
                    setCreateBotDialogOpen(false);
                    setBotName("");
                  } else {
                    toast.error(
                      result.message || "Kon bot account niet aanmaken."
                    );
                  }
                } catch (error) {
                  console.error("Error creating bot account:", error);
                  toast.error(
                    "Er is een fout opgetreden bij het aanmaken van je bot account."
                  );
                } finally {
                  setCreateBotLoading(false);
                }
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bot Dialog */}
      <Dialog open={deleteApiAgentOpen} onOpenChange={setDeleteApiAgentOpen}>
        <DialogContent className="bg-neutral-800 text-white border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-red-400">
              Bot account verwijderen
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Weet je zeker dat je je bot account wilt verwijderen?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-white">
              Als je deze actie uitvoert, wordt de API-sleutel permanent
              verwijderd en kun je geen toegang meer krijgen tot de API met deze
              sleutel.
            </p>
          </div>

          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button1
              text="Annuleren"
              onClick={() => setDeleteApiAgentOpen(false)}
            />
            <Button1
              text="Bot verwijderen"
              onClick={async () => {
                try {
                  const result = await fetch("/api/v1/settings/bot-account", {
                    method: "DELETE",
                  }).then((res) => res.json());

                  if (result.success) {
                    toast.success(result.message);
                    setBotAccount({ name: null, key: null });
                    setDeleteApiAgentOpen(false);
                  } else {
                    toast.error(result.message);
                  }
                } catch (error) {
                  console.error("Error deleting bot account:", error);
                  toast.error(
                    "Er is een fout opgetreden bij het verwijderen van je bot account."
                  );
                }
              }}
              icon={<Trash className="h-4 w-4" />}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center">
            <AlertTriangle className="text-red-500 mr-2 h-6 w-6" /> Gevaarlijke
            zone
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Deze acties kunnen niet ongedaan gemaakt worden. Wees voorzichtig!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userData.scheduledDeletion ? (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-4">
              <h3 className="text-yellow-400 font-medium mb-2">
                Account verwijdering gepland
              </h3>
              <p className="text-sm mb-3">
                Je account is gepland om verwijderd te worden op{" "}
                <span className="font-semibold">
                  {new Date(userData.scheduledDeletion).toLocaleDateString(
                    "nl-NL",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </p>
              <Button1
                text="Verwijdering annuleren"
                onClick={handleCancelDeletion}
              />
            </div>
          ) : (
            <>
              <h3 className="font-medium">Account verwijderen</h3>
              <p className="text-sm text-neutral-400">
                Verwijder permanent je account en alle bijbehorende gegevens.
                Dit kan niet ongedaan gemaakt worden.
              </p>
              <Button1
                text="Account verwijderen"
                onClick={() => setDeleteDialogOpen(true)}
                icon={<Trash className="text-red-500" />}
              />
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground mt-6">
        Je accountgegevens worden beveiligd volgens onze privacyvoorwaarden.
        Voor specifieke vragen kun je contact opnemen met support.
      </p>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-neutral-800 text-white border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-red-400">
              Account verwijderen
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Ben je zeker dat je je account wilt verwijderen?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-4">
              <Switch
                id="dialog-delete-lists"
                checked={deleteLists}
                onCheckedChange={setDeleteLists}
              />
              <Label htmlFor="dialog-delete-lists" className="text-white">
                Verwijder lijsten + samenvattingen
              </Label>
            </div>
            <div className="flex items-center space-x-4">
              <Switch
                id="dialog-delete-forum"
                checked={deleteForumPosts}
                onCheckedChange={setDeleteForumPosts}
              />
              <Label htmlFor="dialog-delete-forum" className="text-white">
                Verwijder forumposts
              </Label>
            </div>
            <p className="text-white">
              Bij het verwijderen van je account worden al je persoonlijke
              gegevens, voortgang en lijsten permanent verwijderd.
            </p>
            <div className="flex justify-end space-x-2">
              <Button1
                text="Annuleer"
                onClick={() => setDeleteDialogOpen(false)}
              />
              <Button1
                text={deleteLoading ? "Verwijderen..." : "Bevestigen"}
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

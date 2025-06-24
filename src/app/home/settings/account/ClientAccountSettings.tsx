"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import Button1 from "@/components/button/Button1";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Preferences {
  streakReminders?: boolean;
  profileVisibility?: boolean;
}

interface InitialData {
  username: string | null;
  email: string | null;
  scheduledDeletion?: string | null;
  preferences?: Preferences;
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
      console.log(err);
    } finally {
      setPasswordLoading(false);
    }
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
      },  
    )
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
          <CardTitle>Data-export</CardTitle>
          <CardDescription className="text-neutral-400">
            Exporteer je gegevens in JSON-formaat. Deze actie kan slechts elke
            30 dagen worden uitgevoerd.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button1
            text={exportLoading ? "Bezig exporteren..." : "Exporteer data"}
            onClick={handleExportData}
            disabled={exportLoading}
          />
        </CardFooter>
      </Card>

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

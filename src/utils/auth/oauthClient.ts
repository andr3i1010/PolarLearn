"use client"

export class ClientGithubOAuth {
    private clientId: string = process.env.NEXT_PUBLIC_GITHUB_ID || "";
    private redirectUri: string =
        (process.env.NEXT_PUBLIC_URL || window.location.origin) + "/api//v1/auth/github";
    private scope: string = "read:user user:email";

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
        });
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }
}

export function getGoogleOAuthParams(): URLSearchParams {
    return new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_ID || "",
        redirect_uri: `${window.location.origin}/api/v1/auth/google`,
        response_type: "code",
        scope: "openid profile email https://www.googleapis.com/auth/user.emails.read",
        access_type: "offline",
        prompt: "consent",
    });
}

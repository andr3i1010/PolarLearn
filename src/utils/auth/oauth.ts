"use server"
import { prisma } from "../prisma";

class GoogleOAuth {
    private clientId: string = process.env.GOOGLE_ID || "";
    private clientSecret: string = process.env.GOOGLE_SECRET || "";
    private redirectUri: string = (process.env.NEXT_PUBLIC_URL || "http://localhost:3000") + "/api/v1/auth/google";
    private scope: string = "openid profile email https://www.googleapis.com/auth/user.emails.read";

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: "code",
            scope: this.scope,
            access_type: "offline",
            prompt: "consent"
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    async getTokens(code: string): Promise<any> {
        try {
            const url = "https://oauth2.googleapis.com/token";
            const body = new URLSearchParams({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                grant_type: "authorization_code"
            });
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body.toString()
            });
            if (!res.ok) {
                const errorText = await res.text();
                console.error("getTokens error:", errorText);
            }
            const json = await res.json();
            return json;
        } catch (error) {
            console.error("getTokens exception:", error);
            throw error;
        }
    }

    async getAlternateEmails(accessToken: string): Promise<string[]> {
        const url = "https://people.googleapis.com/v1/people/me?personFields=emailAddresses";
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const data = await res.json();
        return data.emailAddresses ? data.emailAddresses.map((email: any) => email.value) : [];
    }

    async scanAlternateGoogleEmails(account: any): Promise<any> {
        const url = "https://people.googleapis.com/v1/people/me?personFields=emailAddresses";
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${account.access_token}` }
        });
        const peopleData = await res.json();
        if (peopleData?.emailAddresses && Array.isArray(peopleData.emailAddresses)) {
            for (const emailObj of peopleData.emailAddresses) {
                const altEmail = emailObj?.value;
                if (!altEmail) continue;
                const existingUser = await prisma.user.findUnique({
                    where: { email: altEmail }
                });
                if (existingUser) {
                    if (!existingUser.googleOAuthID) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { googleOAuthID: account.providerAccountId }
                        });
                    }
                    return existingUser;
                }
            }
        }
        return null;
    }

    async mergeGoogleOAuth(accessToken: string, googleProfile: { id: string, email: string }): Promise<any> {
        const alternateEmails = await this.getAlternateEmails(accessToken);
        const existingUser = await prisma.user.findFirst({
            where: { email: { in: alternateEmails } }
        });
        if (existingUser) {
            if (!existingUser.googleOAuthID) {
                return await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { googleOAuthID: googleProfile.id }
                });
            }
            return existingUser;
        }
        return null;
    }
}

class GithubOAuth {
    private clientId: string = process.env.GITHUB_ID || "";
    private clientSecret: string = process.env.GITHUB_SECRET || "";
    private redirectUri: string =
        process.env.NEXT_PUBLIC_URL + "/api/v1/auth/github";
    private scope: string = "read:user user:email";

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
        });
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    async getTokens(code: string): Promise<any> {
        const url = "https://github.com/login/oauth/access_token";
        const body = new URLSearchParams({
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
        });
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        });
        const json = await res.json();
        return json;
    }

    async getUser(accessToken: string): Promise<any> {
        const res = await fetch("https://api.github.com/user", {
            headers: { Authorization: `token ${accessToken}` },
        });
        return await res.json();
    }

    async getUserEmails(accessToken: string): Promise<any[]> {
        const res = await fetch("https://api.github.com/user/emails", {
            headers: { Authorization: `token ${accessToken}` },
        });
        return await res.json();
    }

    async mergeGithubOAuth(
        accessToken: string,
        githubProfile: { id: string; email?: string }
    ): Promise<any> {
        let user = await prisma.user.findUnique({
            where: { email: githubProfile.email || "" },
        });
        if (!user) {
            const emails = await this.getUserEmails(accessToken);
            for (const emailObj of emails) {
                if (emailObj.primary && emailObj.verified) {
                    user = await prisma.user.findUnique({
                        where: { email: emailObj.email },
                    });
                    if (user) break;
                }
            }
        }
        if (user) {
            if (!user.githubOAuthID) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { githubOAuthID: githubProfile.id },
                });
            }
            return user;
        }
        return null;
    }
}

// Create server-side instances
const googleOAuth = new GoogleOAuth();
const githubOAuth = new GithubOAuth();

// Add server functions to generate auth URLs
export async function getGoogleAuthUrl() {
    return googleOAuth.getAuthUrl();
}

export async function getGithubAuthUrl() {
    return githubOAuth.getAuthUrl();
}

// Export async functions for server actions
export async function getGoogleTokens(code: string) {
    return await googleOAuth.getTokens(code);
}

export async function getGoogleAlternateEmails(accessToken: string) {
    return await googleOAuth.getAlternateEmails(accessToken);
}

export async function scanGoogleEmails(account: any) {
    return await googleOAuth.scanAlternateGoogleEmails(account);
}

export async function mergeGoogleAccount(accessToken: string, profile: { id: string, email: string }) {
    return await googleOAuth.mergeGoogleOAuth(accessToken, profile);
}

export async function getGithubTokens(code: string) {
    return await githubOAuth.getTokens(code);
}

export async function getGithubUser(accessToken: string) {
    return await githubOAuth.getUser(accessToken);
}

export async function getGithubUserEmails(accessToken: string) {
    return await githubOAuth.getUserEmails(accessToken);
}

export async function mergeGithubAccount(accessToken: string, profile: { id: string; email?: string }) {
    return await githubOAuth.mergeGithubOAuth(accessToken, profile);
}

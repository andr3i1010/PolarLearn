import { prisma } from "../prisma";

export class GoogleOAuth {
    private clientId: string = process.env.GOOGLE_ID || "";
    private clientSecret: string = process.env.GOOGLE_SECRET || "";
    private redirectUri: string = (process.env.NEXT_PUBLIC_URL || "http://localhost:3000") + "/api/auth/google";
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
            // console.log("getTokens response status:", res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error("getTokens error:", errorText);
            }
            const json = await res.json();
            // // console.log("getTokens returned:", json);
            return json;
        } catch (error) {
            console.error("getTokens exception:", error);
            throw error;
        }
    }

    async getAlternateEmails(accessToken: string): Promise<string[]> {
        // console.log("Fetching alternate emails with access token:", accessToken);
        const url = "https://people.googleapis.com/v1/people/me?personFields=emailAddresses";
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const data = await res.json();
        // console.log("Received alternate emails data:", data);
        return data.emailAddresses ? data.emailAddresses.map((email: any) => email.value) : [];
    }

    async scanAlternateGoogleEmails(account: any): Promise<any> {
        // console.log("Scanning alternate emails for account:", account);
        const url = "https://people.googleapis.com/v1/people/me?personFields=emailAddresses";
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${account.access_token}` }
        });
        const peopleData = await res.json();
        // console.log("People data:", peopleData);
        if (peopleData?.emailAddresses && Array.isArray(peopleData.emailAddresses)) {
            for (const emailObj of peopleData.emailAddresses) {
                const altEmail = emailObj?.value;
                // console.log("Checking alternate email:", altEmail);
                if (!altEmail) continue;
                const existingUser = await prisma.user.findUnique({
                    where: { email: altEmail }
                });
                // console.log("User lookup result for", altEmail, ":", existingUser);
                if (existingUser) {
                    if (!existingUser.googleOAuthID) {
                        // console.log("Linking googleOAuthID for user", existingUser.id, "with providerAccountId", account.providerAccountId);
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { googleOAuthID: account.providerAccountId }
                        });
                    }
                    // console.log("Returning existing user:", existingUser);
                    return existingUser;
                }
            }
        }
        // console.log("No matching user found in alternate emails.");
        return null;
    }

    async mergeGoogleOAuth(accessToken: string, googleProfile: { id: string, email: string }): Promise<any> {
        // console.log("Merging Google OAuth with access token:", accessToken, "and googleProfile:", googleProfile);
        // Fetch alternate emails from People API
        const alternateEmails = await this.getAlternateEmails(accessToken);
        // console.log("Alternate emails fetched:", alternateEmails);

        // Look for a user whose email matches one of the alternate emails
        const existingUser = await prisma.user.findFirst({
            where: { email: { in: alternateEmails } }
        });
        // console.log("Merge lookup result:", existingUser);

        if (existingUser) {
            // Link the OAuth account if not already linked
            if (!existingUser.googleOAuthID) {
                // console.log("Linking googleOAuthID for user", existingUser.id, "with googleProfile id", googleProfile.id);
                return await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { googleOAuthID: googleProfile.id }
                });
            }
            // console.log("OAuth already linked for user", existingUser.id);
            return existingUser;
        }
        // console.log("No matching user found for merging OAuth.");
        // No matching account found; handle merge accordingly
        return null;
    }
}

export class GithubOAuth {
    private clientId: string = process.env.GITHUB_ID || "";
    private clientSecret: string = process.env.GITHUB_SECRET || "";
    private redirectUri: string =
        (process.env.NEXT_PUBLIC_URL || "http://localhost:3000") + "/api/auth/github";
    private scope: string = "read:user user:email";

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
        });
        // console.log(this.redirectUri)
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

/**
 * CrmSync — HubSpot contact sync behind a drop-in interface. When
 * HUBSPOT_ACCESS_TOKEN is present we push contacts with source=promptbuildr,
 * role, and prompt_categories_used; otherwise the DB row is the record of
 * truth and sync is a logged no-op (TODO: wire real HubSpot).
 */

export interface CrmContact {
  email: string;
  role: string;
  categoriesUsed: string[];
}

export interface CrmSyncResult {
  synced: boolean;
  contactId: string | null;
  skippedReason?: string;
}

export interface CrmSync {
  syncContact(contact: CrmContact): Promise<CrmSyncResult>;
}

/** No-op stub used when HubSpot isn't configured. */
class StubCrmSync implements CrmSync {
  async syncContact(): Promise<CrmSyncResult> {
    return { synced: false, contactId: null, skippedReason: "hubspot-not-configured" };
  }
}

/** Real HubSpot client via the CRM contacts API. */
class HubSpotCrmSync implements CrmSync {
  constructor(private token: string) {}

  async syncContact(contact: CrmContact): Promise<CrmSyncResult> {
    const body = {
      properties: {
        email: contact.email,
        source: "promptbuildr",
        role: contact.role,
        prompt_categories_used: contact.categoriesUsed.join(";"),
      },
    };
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        // Contact exists — treat as synced (update path can be added later).
        return { synced: true, contactId: null, skippedReason: "already-exists" };
      }
      if (!res.ok) {
        return { synced: false, contactId: null, skippedReason: `http-${res.status}` };
      }
      const json = (await res.json()) as { id?: string };
      return { synced: true, contactId: json.id ?? null };
    } catch (e) {
      return { synced: false, contactId: null, skippedReason: `error: ${(e as Error).message}` };
    }
  }
}

export function getCrmSync(): CrmSync {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  return token ? new HubSpotCrmSync(token) : new StubCrmSync();
}

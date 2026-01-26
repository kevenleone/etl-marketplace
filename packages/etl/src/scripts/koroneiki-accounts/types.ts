export type AccountsResponse = {
    items: Account[];
};

export type Account = {
    accountContactInformation: AccountContactInformation;
    actions: ActionsMap;
    customFields: unknown[];
    dateCreated: string; // ISO date
    dateModified: string; // ISO date
    defaultBillingAddressId: number;
    defaultShippingAddressId: number;
    description: string;
    domains: string[];
    externalReferenceCode: string;
    id: number;
    logoId: number;
    logoURL: string;
    name: string;
    numberOfUsers: number;
    organizationExternalReferenceCodes: string[];
    organizationIds: number[];
    parentAccountId: number;
    status: number;
    taxId: string;
    type: 'business' | 'person' | string;
};

type Contact = {
    dateCreated: string;
    dateModified: string;
    emailAddress: string;
    emailAddressVerified: boolean;
    entitlements: any[];
    externalLinks: any[];
    firstName: string;
    key: string;
    languageId: string;
    lastName: string;
    middleName: string;
    teams: any[];
    uuid: string;
};

export type AccountContactInformation = {
    emailAddresses: EmailAddress[];
    postalAddresses: PostalAddress[];
    telephones: Telephone[];
    webUrls: WebUrl[];
};

export type ActionsMap = Record<string, ActionLink>;

export type ActionLink = {
    method: HttpMethod;
    href: string;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type KoroneikiAccount = {
    address: any[];
    contactEmailAddress: string;
    description: string;
    externalReferenceCode: string;
    name: string;
    key: string;
    type: string;
    workerContacts: Contact[];
};

export type DxpUserAccount = {
    id: number;
    emailAddress: string;
    name: string;
    accountBriefs?: Array<{
        id: number;
        name: string;
        roleBriefs: any[];
    }>;
};

export type KoroneikiContact = Contact;

export type EmailAddress = Record<string, unknown>;
export type PostalAddress = Record<string, unknown>;
export type Telephone = Record<string, unknown>;
export type WebUrl = Record<string, unknown>;

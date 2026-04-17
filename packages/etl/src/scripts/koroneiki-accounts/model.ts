import mongoose, { Document, Schema } from 'mongoose';
import { KoroneikiAccount } from './types';

export interface IKoroneikiAccount extends KoroneikiAccount, Document {
    processed: boolean;
}

const ExternalLinkSchema = new Schema(
    {
        domain: { type: String, required: false },
        entityName: { type: String, required: false },
        entityId: { type: String, required: false },
    },
    { _id: false },
);

const PostalAddressSchema = new Schema(
    {
        addressCountry: { type: String, required: false },
        addressLocality: { type: String, required: false },
        addressRegion: { type: String, required: false },
        addressType: { type: String, required: false },
        id: { type: Number, required: false },
        mailing: { type: Boolean, required: false },
        postalCode: { type: String, required: false },
        primary: { type: Boolean, required: false },
        streetAddressLine1: { type: String, required: false },
        streetAddressLine2: { type: String, required: false },
        streetAddressLine3: { type: String, required: false },
    },
    { _id: false },
);

const ContactSchema = new Schema(
    {
        dateCreated: { type: String, required: false },
        dateModified: { type: String, required: false },
        emailAddress: { type: String, required: false },
        emailAddressVerified: { type: Boolean, required: false },
        entitlements: { type: [Schema.Types.Mixed], default: [] },
        externalLinks: { type: [Schema.Types.Mixed], default: [] },
        firstName: { type: String, required: false },
        key: { type: String, required: false },
        languageId: { type: String, required: false },
        lastName: { type: String, required: false },
        middleName: { type: String, required: false },
        teams: { type: [Schema.Types.Mixed], default: [] },
        uuid: { type: String, required: false },
    },
    { _id: false },
);

const KoroneikiAccountSchema = new Schema<IKoroneikiAccount>(
    {
        _isPartner: { type: Boolean, default: false },
        contactEmailAddress: { type: String, required: false },
        description: { type: String, required: false },
        externalLinks: { type: [ExternalLinkSchema], default: [] },
        externalReferenceCode: { type: String, required: false },
        key: { type: String, required: true, unique: true },
        name: { type: String, required: false },
        parentAccountKey: { type: String, required: false },
        postalAddresses: { type: [PostalAddressSchema], default: [] },
        processed: { type: Boolean, default: false },
        type: { type: String, required: false },
        workerContacts: { type: [ContactSchema], default: [] },
    },
    {
        timestamps: true,
    },
);

export const KoroneikiAccountModel = mongoose.model<IKoroneikiAccount>(
    'KoroneikiAccount',
    KoroneikiAccountSchema,
);

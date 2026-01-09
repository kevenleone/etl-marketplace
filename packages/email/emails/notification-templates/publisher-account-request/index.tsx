import { Heading, Hr, Img, Link, Section, Text } from '@react-email/components';

import Layout from '../../components/Layout';

type Props = {
    groupKey: string;
    portalUrl: string;
};

export default function PublisherAccountRequest({
    groupKey = '[$GROUP_KEY$]',
    portalUrl = '[$PORTAL_URL$]',
}: Props) {
    return (
        <Layout preview="Invite Members" style={{ maxWidth: '598px' }}>
            <Section className="text-center mb-[19px]">
                <div className="flex justify-center items-center">
                    <Img
                        src={`${portalUrl}/documents/d/${groupKey}/liferay_inc-png`}
                        width="28"
                        height="28"
                        alt="Liferay Logo"
                        className="inline-block mr-1.5"
                    />
                    <Heading
                        as="h1"
                        className="text-2xl font-bold text-heading m-0 inline-block"
                    >
                        Marketplace
                    </Heading>
                </div>
            </Section>

            <Hr className="border-border my-[19px] mb-[56px]" />

            <Section className="mb-[40px]">
                <Heading
                    as="h2"
                    className="text-[32px] font-normal m-0 mb-4 text-text"
                >
                    New Publisher Account Request
                </Heading>

                <Text className="text-base text-text m-0">
                    A new request has been submitted to the Marketplace for a
                    publisher account. Please review the submission and create
                    the publisher account. Invite the user to the account as per
                    existing Marketplace functionality.
                </Text>
            </Section>

            <Section className="mb-[18px]">
                <Link
                    href="#"
                    className="bg-primary text-white rounded-lg text-base font-semibold no-underline inline-block py-2 px-6 w-[175px] text-center"
                >
                    Review Submission
                </Link>
            </Section>

            <Section>
                <Text className="text-text mt-[18px] mb-0">
                    Or copy and paste the link below into you browser
                </Text>
                <Link href="#" className="text-border mt-1 block">
                    placeholder
                </Link>
            </Section>

            <Hr className="border-border my-[56px]" />

            <Section className="text-center mb-[23px]">
                <Text className="text-sm text-text m-0">
                    This email was sent by{' '}
                    <Link href="#" className="text-primary no-underline">
                        Liferay, Inc.
                    </Link>
                </Text>
                <Img
                    src={`${portalUrl}/documents/d/${groupKey}/liferay_logo-png`}
                    width="180"
                    height="57"
                    alt="Liferay Logo"
                    className="mx-auto my-[32px]"
                />

                <Text className="text-text m-0 mt-1">
                    Copyright © 2022 Liferay, Inc.
                </Text>
                <Text className="text-text m-0 mt-1">1400 Montefino Ave</Text>
                <Text className="text-text m-0 mt-1">
                    Diamond Bar, CA 91765
                </Text>
            </Section>

            <Section className="text-center text-sm">
                <Link
                    href="#"
                    className="text-primary no-underline pr-2 border-r-2 border-gray-400"
                >
                    Contact Support
                </Link>
                <Link
                    href="#"
                    className="text-primary no-underline px-2 border-r-2 border-gray-400"
                >
                    Documentation
                </Link>
                <Link
                    href="#"
                    className="text-primary no-underline px-2 border-r-2 border-gray-400"
                >
                    Help Center
                </Link>
                <Link
                    href="#"
                    className="text-primary no-underline px-2 border-r-2 border-gray-400"
                >
                    Announcements
                </Link>
                <Link href="#" className="text-primary no-underline pl-2">
                    Uptime Status
                </Link>
            </Section>
        </Layout>
    );
}

PublisherAccountRequest.PreviewProps = {
    groupKey: 'guest',
    portalUrl: 'https://liferay.com',
} as Props;

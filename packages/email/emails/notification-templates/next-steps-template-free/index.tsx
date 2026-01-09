import {
    Text,
    Heading,
    Link,
    Section,
    Img,
    Hr,
    Container,
} from '@react-email/components';

import Layout from '../../components/Layout';

type Props = {
    getAppInformationDashboardLink: string;
    getAppInformationOrderId: string;
    getAppInformationProductName: string;
};

export default function NextStepsTemplateFree({
    getAppInformationDashboardLink = '[%GETAPPINFORMATION_DASHBOARDLINK%]',
    getAppInformationOrderId = '[%GETAPPINFORMATION_ORDERID%]',
    getAppInformationProductName = '[%GETAPPINFORMATION_PRODUCTNAME%]',
}: Props) {
    return (
        <Layout preview="Next Steps">
            <Section className="text-center mb-[35px] mt-[35px]">
                {/* Logo and Next Steps are handled in content area in original but Logo is in header in Layout.
                    Original: Logo, then Next Steps.
                    Layout: key parts match.
                 */}
            </Section>

            <Heading
                as="h2"
                className="text-[30px] font-bold m-0 mb-4 mt-[2.5rem] text-center text-black"
            >
                Next Steps
            </Heading>

            <Section className="px-[7rem] mb-[2.5rem] text-center">
                <Text className="text-text text-center m-0 mb-4">
                    Congratulations on the purchase of{' '}
                    <b>{getAppInformationProductName}</b>!
                </Text>
                <Text className="text-text text-center m-0 mb-4">
                    Your app is ready for download.
                </Text>
                <Text className="text-text text-center m-0 mb-4">
                    Your Order ID is:{' '}
                    <b className="text-black">{getAppInformationOrderId}</b>
                </Text>
                <Text className="text-text text-center m-0">
                    To find your app download, find your Order ID and choose
                    Manage, then Download LPKG.
                </Text>
            </Section>

            <Section className="text-center mb-[2.5rem]">
                <Link
                    href={getAppInformationDashboardLink}
                    className="bg-white border-2 border-black text-black font-bold py-2 px-6 rounded-lg text-base no-underline inline-block w-[10rem]"
                >
                    Go to Dashboard
                </Link>
            </Section>

            <Section className="text-center px-[7rem] py-1">
                <Link
                    href="https://learn.liferay.com"
                    className="text-primary font-bold text-xl no-underline"
                >
                    Learn more about App Configuration
                </Link>
            </Section>
        </Layout>
    );
}

NextStepsTemplateFree.PreviewProps = {
    getAppInformationDashboardLink: 'https://console.liferay.com',
    getAppInformationOrderId: '123456789',
    getAppInformationProductName: 'Liferay',
} as Props;

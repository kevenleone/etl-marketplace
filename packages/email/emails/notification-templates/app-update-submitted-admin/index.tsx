import {
    Column,
    Heading,
    Img,
    Link,
    Row,
    Section,
    Text,
} from '@react-email/components';

import Layout from '../../components/Layout';

type Props = {
    appType: string;
    cpDefinitionDeveloperName: string;
    cpDefinitionName: string;
    cpDefinitionProductId: string;
    cpDefinitionThumbnail: string;
};

export default function AppUpdateSubmittedAdmin({
    appType = '[%APP_TYPE%]',
    cpDefinitionDeveloperName = '[%CPDEFINITION_DEVELOPER_NAME%]',
    cpDefinitionName = '[%CPDEFINITION_NAME%]',
    cpDefinitionProductId = '[%CPDEFINITION_PRODUCTID%]',
    cpDefinitionThumbnail = '[%CPDEFINITION_THUMBNAIL%]',
}: Props) {
    return (
        <Layout preview="Updated App Submission Pending Your Review">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-center">
                Updated App Submission Pending Your Review
            </Heading>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-6">
                    A publisher has submitted an update to an existing app on
                    the marketplace. Please review the updated submission in the
                    admin panel.
                </Text>
            </Section>

            <Section className="mb-6">
                <Row>
                    <Column width="56">
                        <Img
                            src={cpDefinitionThumbnail}
                            width="56"
                            height="56"
                            alt="App Icon"
                            className="block"
                        />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-[28px] font-semibold text-heading m-0">
                            {cpDefinitionName}
                        </Text>
                        <Row className="mt-1">
                            <Column>
                                <Text className="text-base text-text m-0 pr-4">
                                    {cpDefinitionDeveloperName}
                                </Text>
                            </Column>
                            <Column>
                                <Text className="text-base text-text m-0 pr-4">
                                    {cpDefinitionDeveloperName}
                                </Text>
                            </Column>
                            <Column>
                                <div className="text-[11px] font-semibold h-[20px] w-[44px] text-center rounded bg-gray-200">
                                    {appType}
                                </div>
                            </Column>
                        </Row>
                    </Column>
                </Row>
            </Section>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-4">
                    Once approved, the updated app will go live, replacing the
                    previous version on the marketplace.
                </Text>
                <Text className="text-base text-text m-0">
                    Thank you for your attention.
                </Text>
            </Section>

            <Section className="mb-6">
                <Link
                    href={`https://marketplace.liferay.com/administrator-dashboard#/apps/${cpDefinitionProductId}`}
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block"
                >
                    Review App
                </Link>
            </Section>
        </Layout>
    );
}

AppUpdateSubmittedAdmin.PreviewProps = {
    appType: 'SaaS',
    cpDefinitionDeveloperName: 'Liferay, Inc.',
    cpDefinitionName: 'Liferay',
    cpDefinitionProductId: '123456789',
    cpDefinitionThumbnail: 'https://github.com/liferay.png',
} as Props;

import {
    Text,
    Heading,
    Link,
    Section,
    Img,
    Column,
    Row,
} from '@react-email/components';

import Layout from '../../components/Layout';

type Props = {
    appName: string;
    appType: string;
    catalogName: string;
    cpDefinitionProductId: string;
    productThumbnail: string;
};

export default function NewAppApprovedAndPublished({
    appName = '[%APP_NAME%]',
    appType = '[%APP_TYPE%]',
    catalogName = '[%CATALOG_NAME%]',
    cpDefinitionProductId = '[%CPDEFINITION_PRODUCTID%]',
    productThumbnail = '[%PRODUCT_THUMBNAIL%]',
}: Props) {
    return (
        <Layout preview="Great news! Your App is Now Live on the Marketplace">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-center">
                Great news! Your App is Now Live on the Marketplace
            </Heading>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-6">
                    Your app submitted to the marketplace has been approved and
                    is now availableto users on the marketplace.
                </Text>
            </Section>

            <Section className="mb-6">
                <Row>
                    <Column width="56">
                        <Img
                            src={productThumbnail}
                            width="56"
                            height="56"
                            alt="App Icon"
                            className="block"
                        />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-[28px] font-semibold text-heading m-0">
                            {appName}
                        </Text>
                        <Row className="mt-1">
                            <Column>
                                <Text className="text-base text-text m-0 pr-4">
                                    {catalogName}
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
                <Text className="text-base text-text leading-[22px] m-0 mb-2">
                    From your publisher account, you can:
                </Text>
                <Row className="mb-2">
                    <Column
                        width="20"
                        valign="top"
                        className="text-[20px] leading-[22px]"
                    >
                        •
                    </Column>
                    <Column className="text-base text-text leading-[22px]">
                        <strong>View</strong> how your app appears on the
                        marketplace.
                    </Column>
                </Row>
                <Row className="mb-2">
                    <Column
                        width="20"
                        valign="top"
                        className="text-[20px] leading-[22px]"
                    >
                        •
                    </Column>
                    <Column className="text-base text-text leading-[22px]">
                        <strong>Update</strong> other listing details.
                    </Column>
                </Row>
                <Row>
                    <Column
                        width="20"
                        valign="top"
                        className="text-[20px] leading-[22px]"
                    >
                        •
                    </Column>
                    <Column className="text-base text-text leading-[22px]">
                        <strong>Track</strong> downloads, user feedback, and
                        performance metrics.
                    </Column>
                </Row>
            </Section>

            <Section className="mb-6">
                <Text className="text-base text-text m-0">
                    Thank you for your patience and congratulations on your
                    successful submission!
                </Text>
            </Section>

            <Section className="mb-12">
                <Link
                    href={`https://marketplace.liferay.com/publisher-dashboard#/app/${cpDefinitionProductId}`}
                    className="bg-white border border-primary text-primary font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block"
                >
                    Go to Dashboard
                </Link>
            </Section>

            <Section className="bg-[#F7F7F8] rounded-lg p-6 mb-6">
                <Text className="text-base font-semibold text-heading m-0 mb-2">
                    Do you need help?
                </Text>
                <Text className="text-xs text-text m-0">
                    If you have any questions, please{' '}
                    <Link
                        href="#"
                        className="font-semibold text-primary no-underline"
                    >
                        Learn more about App Submission and Review.
                    </Link>
                </Text>
            </Section>
        </Layout>
    );
}

NewAppApprovedAndPublished.PreviewProps = {
    appName: 'Liferay',
    appType: 'SaaS',
    catalogName: 'Liferay, Inc.',
    cpDefinitionProductId: '123456789',
    productThumbnail: 'https://github.com/liferay.png',
} as Props;

import {
    Text,
    Heading,
    Link,
    Section,
    Img,
    Column,
    Row,
} from '@react-email/components';

import Layout from '../../layout/Layout';

type Props = {
    appId: string;
    appName: string;
    appPrice: string;
    catalogName: string;
    cpDefinitionProductId: string;
    emailDescription: string;
    livePreview: boolean;
    productThumbnail: string;
};

export default function AppUpdateSubmittedPublisher({
    appName = '[%APP_NAME%]',
    appId = '[%APP_ID%]',
    appPrice = '[%APP_PRICE%]',
    catalogName = '[%CATALOG_NAME%]',
    cpDefinitionProductId = '[%CPDEFINITION_PRODUCTID%]',
    emailDescription = '[%APP_DESCRIPTION%]',
    livePreview = false,
    productThumbnail = '[%PRODUCT_THUMBNAIL%]',
}: Props) {
    return (
        <Layout preview="Order Confirmation">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-left">
                Order Confirmation
            </Heading>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-0">
                    Congratulations on the purchase of:
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
                        
                        <Row className="mt-1">
                            <Column>
                                <Text className="text-[23px] font-semibold text-heading m-0">
                                    {appName}
                                </Text>
                                <Text className="text-base text-text m-0 pr-4">
                                    {catalogName}
                                </Text>
                            </Column>
                            <Column>
                                <Text className="text-[14px] font-semibold text-right">
                                    {appPrice}
                                </Text>
                            </Column>
                        </Row>
                    </Column>
                </Row>
            </Section>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-4">
                    Your Order ID is:{' '}
                    <span className="font-bold">
                        {appId}
                    </span>
                    
                </Text>
                {livePreview ? <div
					dangerouslySetInnerHTML={{
						__html: (emailDescription),
					}}
				/> : emailDescription}
            </Section>

            <Section className="mb-12">
                <Link
                    href={`https://marketplace.liferay.com/publisher-dashboard#/app/${cpDefinitionProductId}`}
                    className="bg-primary border border-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block"
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
                        Contact Support.
                    </Link>
                </Text>
            </Section>
        </Layout>
    );
}

AppUpdateSubmittedPublisher.PreviewProps = {
    appName: 'Customer Data Platform',
    appId: '26574346',
    appPrice: '€1.230,00',
    catalogName: 'Liferay, Inc.',
    cpDefinitionProductId: '123456789',
    emailDescription: `<p style="color:gray; margin:0px; line-height: 24px;">Your workspace is being created now!</p>
    <p style="color:gray; margin:0px; line-height: 24px;">Click the button below to go to your dashboard and check the status of your environment. You can start using it as soon as it is ready.</p>`,
    livePreview: true,
    productThumbnail: 'https://github.com/liferay.png',
} as Props;

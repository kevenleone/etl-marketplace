import {
    Text,
    Heading,
    Hr,
    Link,
    Section,
    Img,
    Column,
    Row,
} from '@react-email/components';

import Layout from '../../layout/Layout';

type Props = {
    orderId: string;
    appNetPrice: string;
    appVAT: string;
    appTotalPrice: string;
    buttonText: string;
    livePreview: boolean;
    appName: string;
    appPrice: string;
    emailDescription: string;
    catalogName: string;
    cpDefinitionProductId: string;
    productThumbnail: string;
};

export default function AppUpdateSubmittedPublisher({
    appName = '[%APP_NAME%]',
    buttonText = '[%BUTTON_TEXT%]',
    orderId = '[%ORDER_ID%]',
    appNetPrice = '[%APP_NET_PRICE%]',
    appVAT = '[%APP_VAT%]',
    appTotalPrice = '[%APP_TOTAL_PRICE%]',
    catalogName = '[%CATALOG_NAME%]',
    cpDefinitionProductId = '[%CPDEFINITION_ID%]',
    emailDescription = '[%EMAIL_DESCRIPTION%]',
    livePreview = false,
    productThumbnail = '[%PRODUCT_THUMBNAIL%]',
}: Props) {
    return (
        <Layout preview="Your App Update is Under Review">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-left">
                Payment Received!
            </Heading>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-0">
                    Congratulations on the purchase of:
                </Text>
            </Section>

            <Section className="mb-6">
                <Row>
                    <Column style={{ verticalAlign: 'top' }} width="56">
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
                            <Column style={{ verticalAlign: 'top' }}>
                                <Text className="text-[23px] font-semibold text-heading m-0">
                                    {appName}
                                </Text>
                                <Text className="text-base text-text m-0 pr-4">
                                    {catalogName}
                                </Text>
                            </Column>
                            <Column style={{ verticalAlign: 'top' }}>
                                <Row>
                                    <Column>
                                        <Text className="text-[14px] text-left m-0">
                                            Net Price:
                                        </Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[14px] font-semibold text-right m-0">
                                            {appNetPrice}
                                        </Text>
                                    </Column>
                                </Row>
                                <Row>
                                    <Column>
                                        <Text className="text-[14px] text-left m-0">
                                            VAT:
                                        </Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[14px] font-semibold text-right m-0">
                                            {appVAT}
                                        </Text>
                                    </Column>
                                </Row>
                                <Row>
                                    <Column>
                                        <Text className="text-[16px] text-left m-0">
                                            Total:
                                        </Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[16px] font-semibold text-right m-0">
                                            {appTotalPrice}
                                        </Text>
                                    </Column>
                                </Row>
                            </Column>
                        </Row>
                    </Column>
                </Row>
            </Section>
            <Hr />
            <Section className="mt-4 mb-6">
                <Text className="text-base text-text m-0 mb-4">
                    Your Order ID is:{' '}
                    <span className="font-bold">
                        {orderId}
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
                    {buttonText}
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
    appNetPrice: '$200.00',
    appVAT: '$44.00',
    appTotalPrice: '$261.00',
    buttonText: 'Launch LDP',
    orderId: '26574346',
    appPrice: '€1.230,00',
    livePreview: true,
    catalogName: 'Liferay, Inc.',
    emailDescription: ` <p style="color:gray; margin:0px; line-height: 24px;">You are all set 🚀 You <b>can start using all the premium features</b> of your Customer Data Platform right away. Click the button below to access your CDP and enjoy the full experience.</p>`,
    cpDefinitionProductId: '123456789',
    productThumbnail: 'https://github.com/liferay.png',
} as Props;

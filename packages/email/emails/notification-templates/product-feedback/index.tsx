import {
    Column,
    Heading,
    Img,
    Link,
    Row,
    Section,
    Text,
} from '@react-email/components';

import Layout from '../../layout/Layout';

type Props = {
    appType: string;
    cpDefinitionDeveloperName: string;
    cpDefinitionName: string;
    cpDefinitionThumbnail: string;
    emailDescription: string;
    enviroment: string;
    orderId: string;
    livePreview: boolean;
};

export default function ProductFeedback({
    appType = '[%APP_TYPE%]',
    cpDefinitionDeveloperName = '[%CATALOG_NAME%]',
    cpDefinitionName = '[%CPDEFINITION_NAME%]',
    cpDefinitionThumbnail = '[%CPDEFINITION_THUMBNAIL%]',
    emailDescription = '[%EMAIL_DESCRIPTION%]',
    enviroment = '[%ENVIROMENT%]',
    orderId = '[%ORDER_ID%]',
    livePreview = false,
}: Props) {
    return (
        <Layout preview="Your Opinion Matters">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-left">
                Your Opinion Matters!
            </Heading>

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
                        <Row className="mt-1">
                            <Column
                                style={{
                                    display: 'inline-block',
                                    width: 'auto',
                                }}
                            >
                                <Text className="text-[23px] font-semibold text-heading m-0">
                                    {cpDefinitionName}
                                </Text>
                            </Column>

                            <Column
                                style={{
                                    display: 'inline-block',
                                    width: 'auto',
                                    paddingTop: '0',
                                    paddingLeft: '12px',
                                }}
                            >
                                <Text className="text-[13px] text-[#166E9E] font-semibold text-center rounded bg-[#D1ECFA] px-[8px] py-[4px] m-0">
                                    {appType}
                                </Text>
                            </Column>
                        </Row>
                        <Text className="text-base text-text m-0 pr-4">
                            {cpDefinitionDeveloperName}
                        </Text>
                    </Column>
                </Row>
            </Section>

            <Section className="mb-4 text-base text-text">
                {livePreview ? (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: emailDescription,
                        }}
                    />
                ) : (
                    emailDescription
                )}
            </Section>

            <Section className="mb-6">
                <Link
                    href={`https://${enviroment}.liferay.com/product-feedback?orderId=${orderId}`}
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block"
                >
                    Share Beta Feedback
                </Link>
            </Section>
        </Layout>
    );
}

ProductFeedback.PreviewProps = {
    appType: 'Beta',
    buttonLink: 'liferay.com',
    cpDefinitionDeveloperName: 'Liferay, Inc.',
    cpDefinitionName: 'Content Marketing Platform',
    cpDefinitionThumbnail: 'https://github.com/liferay.png',
    emailDescription: `<p>It has been a few weeks since you started using <b>CMP </b>
                    Beta via the Marketplace. We hope it’s helping you
                    streamline your Liferay operations. Could you spare 
                    <b>5 minutes</b> to let us know how we’re doing?</p>`,
    enviroment: 'marketplace-uat',
    orderId: '42168052',
    livePreview: true,
} as Props;

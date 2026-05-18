import {
    Column,
    Heading,
    Img,
    Link,
    Row,
    Section,
    Text,
} from '@react-email/components';

import { LIFERAY_HOME } from '../../constants';
import Layout from '../../layout/Layout';

type Props = {
    catalogName: string;
    cpDefinitionProductId: string;
    productName: string;
    productThumbnail: string;
    productType: string;
};

export default function AIHubOrderConfirmation({
    catalogName = '[%CATALOG_NAME%]',
    cpDefinitionProductId = '[%CPDEFINITION_PRODUCTID%]',
    productName = '[%PRODUCT_NAME%]',
    productThumbnail = '[%PRODUCT_THUMBNAIL%]',
    productType = '[%PRODUCT_TYPE%]',
}: Props) {
    return (
        <Layout preview="You're all set!...">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-left">
                You're all set!...
            </Heading>

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
                            <Column
                                style={{
                                    display: 'inline-block',
                                    width: 'auto',
                                }}>
                                <Text className="text-[23px] font-semibold text-heading m-0 pr-3">
                                    {productName}
                                </Text>
                            </Column>
                            <Column
                            style={{
                                    display: 'inline-block',
                                    width: 'auto',
                                }}>
                                <Text className="text-[11px] text-center font-semibold px-[8px] m-0 rounded bg-gray-200">
                                    {productType}
                                </Text>
                            </Column>
                        </Row>

                
                        <Text className="text-base text-text m-0">
                            By {catalogName}
                        </Text>
                    
                    </Column>
                </Row>
            </Section>

            <Section className="mb-6">
                <Text className="text-base text-text m-0">
                    We've received your signed order form and your <span className="font-semibold">Liferay AI Hub</span> has been provisioned successfully. 🎉
                </Text>
                <Text className="text-base text-text m-0">
                    You can now access the platform and find your subscription details, including your monthly token allocation, in your account dashboard.
                </Text>
            </Section>

            <Section className="mb-6">
                <Link
                    href={`${LIFERAY_HOME}/administrator-dashboard#/apps/${cpDefinitionProductId}`}
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block"
                >
                    Open AI Hub
                </Link>
            </Section>
        </Layout>
    );
}

AIHubOrderConfirmation.PreviewProps = {
    catalogName: 'Liferay, Inc.',
    cpDefinitionProductId: '123456789',
    productName: 'AI Hub',
    productThumbnail: 'https://marketplace.liferay.com/documents/d/marketplace/liferay-logo-28',
    productType: 'Beta',
} as Props;

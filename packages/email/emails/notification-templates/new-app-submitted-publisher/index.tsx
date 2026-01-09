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

export default function NewAppSubmittedPublisher() {
    return (
        <Layout preview="Thank you for submitting your app">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-center">
                Thank you for submitting your app
            </Heading>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-6">
                    Your submission is currently under review by Liferay's Team.
                    Once the process is complete, the app will be immeiately
                    published on the Marketplace. Meanwhile, any information or
                    data from this app submission cannot be updated.
                </Text>
            </Section>

            <Section className="mb-6">
                <Row>
                    <Column width="56">
                        <Img
                            src="[%PRODUCT_THUMBNAIL%]"
                            width="56"
                            height="56"
                            alt="App Icon"
                            className="block"
                        />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-[28px] font-semibold text-heading m-0">
                            [%APP_NAME%]
                        </Text>
                        <Row className="mt-1">
                            <Column>
                                <Text className="text-base text-text m-0 pr-4">
                                    [%CATALOG_NAME%]
                                </Text>
                            </Column>
                            <Column>
                                <div className="text-[11px] font-semibold h-[20px] w-[44px] text-center rounded bg-gray-200">
                                    [%APP_TYPE%]
                                </div>
                            </Column>
                        </Row>
                    </Column>
                </Row>
            </Section>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-4">
                    You will be notified by email once a decision has been made:{' '}
                    <span className="font-bold">
                        this process may takes up to 3 business days.
                    </span>
                </Text>
                <Text className="text-base text-text m-0">
                    Thanks for your patience!
                </Text>
            </Section>

            <Section className="mb-12">
                <Link
                    href="https://marketplace.liferay.com/publisher-dashboard#/app/[%CPDEFINITION_PRODUCTID%]"
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

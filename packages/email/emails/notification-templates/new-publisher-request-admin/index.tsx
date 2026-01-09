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

export default function NewPublisherRequestAdmin() {
    return (
        <Layout preview="New Publisher Request Pending Approval">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-center">
                New Publisher Request Pending Approval
            </Heading>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-6">
                    A user has requested to become a publisher on the
                    marketplace. Please review the request in the admin panel
                    and decide whether to approve or reject it.
                </Text>
            </Section>

            <Section className="mb-6">
                <Row>
                    <Column width="58">
                        <Img
                            src="[%PUBLISHER_IMAGE%]"
                            width="58"
                            height="58"
                            alt="App Icon"
                            className="rounded-full block"
                        />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-[28px] font-semibold text-heading m-0">
                            [%PUBLISHER_NAME%]
                        </Text>
                        <Text className="text-base text-text m-0">
                            [%CATALOG_NAME%]
                        </Text>
                    </Column>
                </Row>
            </Section>

            <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-4">
                    Once approved, the user will be able to submit apps and
                    manage their listings. Thank you for your attention.
                </Text>
            </Section>

            <Section className="mb-6">
                <Link
                    href="https://marketplace.liferay.com/administrator-dashboard#/publisher-request"
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block"
                >
                    Review Publisher Request
                </Link>
            </Section>
        </Layout>
    );
}

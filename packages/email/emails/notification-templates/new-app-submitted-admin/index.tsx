import { Text, Heading, Link, Section, Img, Column, Row } from '@react-email/components';

import Layout from '../../components/Layout';

export default function NewAppSubmittedAdmin() {
    return (
        <Layout preview="New App Submission Pending Approval">
             <Heading className="text-[32px] font-bold text-heading mb-6 text-center">New App Submission Pending Approval</Heading>
             
             <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-6">
                    A publisher has submitted a new app to the marketplace. Please review the app details in the admin panel and decide whether to approve or reject the submission.
                </Text>
             </Section>

             <Section className="mb-6">
                <Row>
                    <Column width="56">
                        <Img src="[%CPDEFINITION_THUMBNAIL%]" width="56" height="56" alt="App Icon" className="block" />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-[28px] font-semibold text-heading m-0">[%CPDEFINITION_NAME%]</Text>
                        <Row className="mt-1">
                             <Column>
                                <Text className="text-base text-text m-0 pr-4">[%CPDEFINITION_DEVELOPER_NAME%]</Text>
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
                    Once approved, the app will become available for every Marketplace users.
                </Text>
                <Text className="text-base text-text m-0">
                    Thank you for your attention.
                </Text>
             </Section>

             <Section className="mb-6">
                <Link href="https://marketplace.liferay.com/administrator-dashboard#/apps/[%CPDEFINITION_PRODUCTID%]" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block">
                    Review App
                </Link>
             </Section>
        </Layout>
    );
}

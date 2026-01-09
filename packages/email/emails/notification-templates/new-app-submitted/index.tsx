import { Text, Heading, Link, Section, Img, Column, Row } from '@react-email/components';

import Layout from '../../components/Layout';

export default function NewAppSubmitted() {
    return (
        <Layout preview="New app submitted">
             <Heading className="text-[32px] font-bold text-heading mb-6 text-center">New app submitted</Heading>
             
             <Section className="mb-6">
                <Row>
                    <Column width="60">
                        <Img src="[%CPDEFINITION_THUMBNAIL%]" width="60" height="60" alt="App Icon" className="rounded" />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-xl font-semibold text-heading m-0">[%CPDEFINITION_NAME%]</Text>
                        <Text className="text-base text-text m-0">[%CPDEFINITION_DEVELOPER_NAME%]</Text>
                    </Column>
                </Row>
             </Section>

             <Section className="mb-6">
                <Text className="text-lg text-text">
                    Submission Date:{' '}
                    <span className="font-semibold text-heading">[%CPDEFINITION_CREATEDATE%]</span>
                </Text>
             </Section>

             <Section className="mb-6 text-center">
                <Link href="[%CPDEFINITION_URL%]" className="bg-primary text-white font-bold py-3 px-6 rounded-lg text-base no-underline inline-block">
                    Go to app
                </Link>
             </Section>
        </Layout>
    );
}

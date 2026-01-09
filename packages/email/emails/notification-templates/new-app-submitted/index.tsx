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
    cpDefinitionCreateDate: string;
    cpDefinitionDeveloperName: string;
    cpDefinitionName: string;
    cpDefinitionThumbnail: string;
    cpDefinitionUrl: string;
};

export default function NewAppSubmitted({
    cpDefinitionCreateDate = '[%CPDEFINITION_CREATEDATE%]',
    cpDefinitionDeveloperName = '[%CPDEFINITION_DEVELOPER_NAME%]',
    cpDefinitionName = '[%CPDEFINITION_NAME%]',
    cpDefinitionThumbnail = '[%CPDEFINITION_THUMBNAIL%]',
    cpDefinitionUrl = '[%CPDEFINITION_URL%]',
}: Props) {
    return (
        <Layout preview="New app submitted">
            <Heading className="text-[32px] font-bold text-heading mb-6 text-center">
                New app submitted
            </Heading>

            <Section className="mb-6">
                <Row>
                    <Column width="60">
                        <Img
                            src={cpDefinitionThumbnail}
                            width="60"
                            height="60"
                            alt="App Icon"
                            className="rounded"
                        />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-xl font-semibold text-heading m-0">
                            {cpDefinitionName}
                        </Text>
                        <Text className="text-base text-text m-0">
                            {cpDefinitionDeveloperName}
                        </Text>
                    </Column>
                </Row>
            </Section>

            <Section className="mb-6">
                <Text className="text-lg text-text">
                    Submission Date:{' '}
                    <span className="font-semibold text-heading">
                        {cpDefinitionCreateDate}
                    </span>
                </Text>
            </Section>

            <Section className="mb-6 text-center">
                <Link
                    href={cpDefinitionUrl}
                    className="bg-primary text-white font-bold py-3 px-6 rounded-lg text-base no-underline inline-block"
                >
                    Go to app
                </Link>
            </Section>
        </Layout>
    );
}

NewAppSubmitted.PreviewProps = {
    cpDefinitionCreateDate: 'Jan 1, 2023',
    cpDefinitionDeveloperName: 'Liferay, Inc.',
    cpDefinitionName: 'Liferay',
    cpDefinitionThumbnail: 'https://github.com/liferay.png',
    cpDefinitionUrl: 'https://marketplace.liferay.com',
} as Props;

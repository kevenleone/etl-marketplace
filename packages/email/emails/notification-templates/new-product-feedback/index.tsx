import { Section, Text } from '@react-email/components';

import Layout from '../../layout/Layout';

type Props = {
    companyName: string;
    fullName: string;
    jobTitle: string;
    emailAddress: string;
    productName: string;
    ratingEaseOfUse: string;
    ratingSatisfaction: string;
    ratingUsefulness: string;
    suggestionFeatures: string;
    suggestionImprovements: string;
    suggestionSatisfaction: string;
};

export default function NewProductFeedbackNotification({
    companyName = '[%PRODUCTFEEDBACK_COMPANYNAME%]',
    fullName = '[%PRODUCTFEEDBACK_FULLNAME%]',
    jobTitle = '[%PRODUCTFEEDBACK_JOBTITLE%]',
    emailAddress = '[%PRODUCTFEEDBACK_EMAILADDRESS%]',
    productName = '[%PRODUCT_NAME%]',
    ratingEaseOfUse = '[%PRODUCTFEEDBACK_RATINGEASEOFUSE%]',
    ratingSatisfaction = '[%PRODUCTFEEDBACK_RATINGSATISFACTION%]',
    ratingUsefulness = '[%PRODUCTFEEDBACK_RATINGUSEFULNESS%]',
    suggestionFeatures = '[%PRODUCTFEEDBACK_SUGGESTIONFEATURES%]',
    suggestionImprovements = '[%PRODUCTFEEDBACK_SUGGESTIONIMPROVEMENTS%]',
    suggestionSatisfaction = '[%PRODUCTFEEDBACK_SUGGESTIONSATISFACTION%]',
}: Props) {
    return (
        <Layout preview="New Product Feedback Notification">
            <Section className="mb-6"></Section>

            <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">Admin</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    A new feedback has been submitted for{' '}
                    <span className="font-bold">{productName}</span>.
                </Text>

                <Text className="text-base text-text mb-4">
                    Name: <span className="font-bold">{fullName}</span>
                    <br />
                    Email: <span className="font-bold">{emailAddress}</span>
                    <br />
                    Company: <span className="font-bold">{companyName}</span>
                    <br />
                    Job Title: <span className="font-bold">{jobTitle}</span>
                    <br />
                    Rating - Ease of Use:{' '}
                    <span className="font-bold">{ratingEaseOfUse}</span>
                    <br />
                    Rating - Satisfaction:{' '}
                    <span className="font-bold">{ratingSatisfaction}</span>
                    <br />
                    Rating - Usefulness:{' '}
                    <span className="font-bold">{ratingUsefulness}</span>
                    <br />
                    Suggestion - Features:{' '}
                    <span className="font-bold">{suggestionFeatures}</span>
                    <br />
                    Suggestion - Improvements:{' '}
                    <span className="font-bold">{suggestionImprovements}</span>
                    <br />
                    Suggestion - Satisfaction:{' '}
                    <span className="font-bold">{suggestionSatisfaction}</span>
                </Text>

                <Text className="text-base text-text mb-8">
                    Regards,
                    <br />
                    The Liferay Marketplace Team
                </Text>
            </Section>
        </Layout>
    );
}

NewProductFeedbackNotification.PreviewProps = {
    companyName: 'Example Company',
    fullName: 'John Doe',
    jobTitle: 'Software Engineer',
    emailAddress: 'john.doe@example.com',
    productName: 'Example Product',
    ratingEaseOfUse: '5',
    ratingSatisfaction: '5',
    ratingUsefulness: '5',
    suggestionFeatures: 'Feature suggestions',
    suggestionImprovements: 'Improvement suggestions',
    suggestionSatisfaction: 'Satisfaction suggestions',
} as Props;

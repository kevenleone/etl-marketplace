import { Text, Link, Section } from '@react-email/components';

import Layout from '../../components/Layout';

type Props = {
    trialCreatorFirstName: string;
    trialEndDate: string;
};

export default function TrialExpiringOrder({
    trialCreatorFirstName = '[%TRIAL_CREATOR_FIRST_NAME%]',
    trialEndDate = '[%TRIAL_END_DATE%]',
}: Props) {
    return (
        <Layout preview="Trial Expiring Order">
            <Section className="mb-6">
                {/* Empty div in original, but spacing might be needed */}
            </Section>

            <Section>
                <Text className="text-base text-text mb-4">
                    Dear{' '}
                    <span className="font-bold">{trialCreatorFirstName}</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    Your Trial will end on{' '}
                    <span className="font-bold">{trialEndDate}</span> and all of
                    your data will be deleted automatically.
                </Text>

                <Text className="text-base text-text mb-4">
                    We look forward to continuing to support your success.
                </Text>

                <Text className="text-base text-text mb-8">
                    Thank you,
                    <br />
                    Liferay Marketplace Team
                </Text>

                <Link
                    href="http://localhost:8080/customer-dashboard/#/solutions"
                    className="bg-highlight text-primary font-semibold text-base py-3 px-6 rounded-lg no-underline inline-block text-center min-w-[150px]"
                >
                    Go to Dashboard
                </Link>
            </Section>
        </Layout>
    );
}

TrialExpiringOrder.PreviewProps = {
    trialCreatorFirstName: 'John',
    trialEndDate: 'Jan 01, 2023',
} as Props;

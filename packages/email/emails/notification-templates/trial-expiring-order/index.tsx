import { Text, Link, Section } from '@react-email/components';

import TrialLayout from '../../components/TrialLayout';

export default function TrialExpiringOrder() {
    return (
        <TrialLayout preview="Trial Expiring Order">
             <Section className="mb-6">
                 {/* Empty div in original, but spacing might be needed */}
             </Section>

             <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">[%TRIAL_CREATOR_FIRST_NAME%]</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    Your Trial will end on <span className="font-bold">[%TRIAL_END_DATE%]</span> and all of your data will be deleted automatically.
                </Text>

                <Text className="text-base text-text mb-4">
                    We look forward to continuing to support your success.
                </Text>

                <Text className="text-base text-text mb-8">
                    Thank you,<br />
                    Liferay Marketplace Team
                </Text>

                <Link 
                    href="http://localhost:8080/customer-dashboard/#/solutions" 
                    className="bg-highlight text-primary font-semibold text-base py-3 px-6 rounded-lg no-underline inline-block text-center min-w-[150px]"
                >
                    Go to Dashboard
                </Link>
             </Section>
        </TrialLayout>
    );
}

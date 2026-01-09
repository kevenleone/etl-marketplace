import { Text, Heading, Link, Section } from '@react-email/components';

import TrialLayout from '../../components/TrialLayout';

export default function TrialProcessingOrder() {
    return (
        <TrialLayout preview="Trial Processing Order">
             <Section className="mb-6">
                 {/* Spacing handled by layout */}
             </Section>

             <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">[%COMMERCEORDER_AUTHOR_FIRST_NAME%]</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    Welcome to Liferay Marketplace! We're thrilled to have you on board for your trial.
                </Text>

                <Text className="text-base text-text mb-4">
                    Your Order ID is: <span className="font-bold">[%COMMERCEORDER_ID%]</span>
                </Text>

                <Text className="text-base text-text mb-4">
                    Please be patient as we provision your solution. This process <span className="font-bold">may take a few minutes.</span>
                </Text>

                <Text className="text-base text-text mb-4">
                    Once provisioning is complete, you'll receive another email containing detailed instructions.
                </Text>

                <Text className="text-base text-text mb-8">
                    Regards,<br />
                    The Liferay Marketplace Team
                </Text>

             </Section>
        </TrialLayout>
    );
}

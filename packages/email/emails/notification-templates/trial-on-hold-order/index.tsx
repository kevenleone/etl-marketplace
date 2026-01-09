import { Text, Heading, Link, Section } from '@react-email/components';

import TrialLayout from '../../components/TrialLayout';

export default function TrialOnHoldOrder() {
    return (
        <TrialLayout preview="Trial On Hold Order">
             <Section className="mb-6">
             </Section>

             <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">[%COMMERCEORDER_AUTHOR_FIRST_NAME%]</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    Welcome to your trial! We're thrilled to have you on board.
                </Text>

                <Text className="text-base text-text mb-4">
                    Your Order ID is: <span className="font-bold">[%COMMERCEORDER_ID%]</span>
                </Text>

                <Text className="text-base text-text mb-4">
                    At this time, your request is waiting to be processed by our systems.
                </Text>

                <Text className="text-base text-text mb-4">
                    As soon as your solution is ready to use, we will send you a confirmation email with all the activation details.
                </Text>

                <Text className="text-base text-text mb-8">
                    Regards,<br />
                    The Liferay Marketplace Team
                </Text>

             </Section>
        </TrialLayout>
    );
}

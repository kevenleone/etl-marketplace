import { Text, Heading, Link, Section } from '@react-email/components';

import TrialLayout from '../../components/TrialLayout';

export default function TrialAdminNotification() {
    return (
        <TrialLayout
            preview="Trial Admin Notification"
            style={{ maxWidth: '640px' }}
        >
            <Section className="mb-6"></Section>

            <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">SSA Admin</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    A new trial has been started.
                </Text>

                <Text className="text-base text-text mb-4">
                    Author Name:{' '}
                    <span className="font-bold">
                        [%COMMERCEORDER_ACCOUNT_NAME%]
                    </span>
                    <br />
                    Author Email:{' '}
                    <span className="font-bold">
                        [%COMMERCEORDER_AUTHOR_EMAIL_ADDRESS%]
                    </span>
                    <br />
                    Order ID:{' '}
                    <span className="font-bold">[%COMMERCEORDER_ID%]</span>
                    <br />
                    Created At:{' '}
                    <span className="font-bold">
                        [%COMMERCEORDER_CREATEDATE%]
                    </span>
                </Text>

                <Text className="text-base text-text mb-8">
                    Regards,
                    <br />
                    The Liferay Marketplace Team
                </Text>
            </Section>
        </TrialLayout>
    );
}

import { Link, Section, Text } from '@react-email/components';

import TrialLayout from '../../components/TrialLayout';

export default function TrialCompletedOrder() {
    return (
        <TrialLayout preview="Trial Completed Order">
            <Section className="mb-6"></Section>

            <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">%NAME%</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    Your Trial is available at the following URL:{' '}
                    <Link href="https://%URL%">%URL%</Link>
                </Text>

                <Text className="text-base text-text mb-4">
                    Please use the information below to access it:
                </Text>

                <Text className="text-base text-text mb-4">
                    <span className="font-bold">Username:</span> %EMAIL%
                    <br />
                    <span className="font-bold">Password:</span> `test`
                </Text>

                <Text className="text-base text-text mb-4">
                    You can manage your trial using the Marketplace Dashboard.
                    It will be available for 7 days unless you choose to extend
                    it.
                </Text>

                <Text className="text-base text-text mb-8">
                    Regards,
                    <br />
                    The Liferay Marketplace Team
                    <br />
                </Text>

                <Section className="mt-5 text-center">
                    <Link
                        href="%URL%"
                        className="bg-primary text-white font-semibold py-3 px-6 rounded-lg text-base no-underline inline-block items-center justify-center min-w-[150px] mr-3"
                    >
                        Access your solution
                    </Link>
                    <Link
                        href="http://localhost:8080/web/marketplace/customer-dashboard/#/solutions"
                        className="bg-[#edf3fe] text-primary font-semibold py-3 px-6 rounded-lg text-base no-underline inline-block items-center justify-center min-w-[150px]"
                    >
                        Go to Dashboard
                    </Link>
                </Section>
            </Section>
        </TrialLayout>
    );
}

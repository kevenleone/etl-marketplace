import { Link, Section, Text } from '@react-email/components';

import Layout from '../../components/Layout';

type Props = {
    name: string;
    url: string;
    email: string;
};

export default function TrialCompletedOrder({
    name = '%NAME%',
    url = '%URL%',
    email = '%EMAIL%',
}: Props) {
    return (
        <Layout preview="Trial Completed Order">
            <Section className="mb-6"></Section>

            <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">{name}</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    Your Trial is available at the following URL:{' '}
                    <Link href={`https://${url}`}>{url}</Link>
                </Text>

                <Text className="text-base text-text mb-4">
                    Please use the information below to access it:
                </Text>

                <Text className="text-base text-text mb-4">
                    <span className="font-bold">Username:</span> {email}
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
                        href={url}
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
        </Layout>
    );
}

TrialCompletedOrder.PreviewProps = {
    name: 'John Doe',
    url: 'liferay.com',
    email: 'test@liferay.com',
} as Props;

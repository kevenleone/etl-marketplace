import { Heading, Link, Section, Text } from '@react-email/components';

import Layout from '../../layout/Layout';

type Props = {
    commerceOrderId: string;
};

export default function NextStepsTemplatePaidOrTrial({
    commerceOrderId = '[%COMMERCEORDER_ID%]',
}: Props) {
    return (
        <Layout preview="Next Steps Paid DXP">
            <Section className="text-center mb-[35px] mt-[35px]"></Section>

            <Heading
                as="h2"
                className="text-[30px] font-bold m-0 mb-4 mt-[2.5rem] text-center text-black"
            >
                Next Steps
            </Heading>

            <Section className="px-[7rem] mb-[2.5rem] text-center">
                <Text className="text-text text-center m-0 mb-4">
                    Congratulations on your recent purchase!
                </Text>
                <Text className="text-text text-center m-0 mb-4">
                    Before deploying to your DXP instance, you'll need to create
                    a license for your app.
                </Text>
                <Text className="text-text text-center m-0 mb-4">
                    Your Order ID is: <strong>{commerceOrderId}</strong>
                </Text>
                <Text className="text-text text-center m-0">
                    Click <strong>Continue Configuration</strong> below to
                    license your app, or visit your Dashboard to locate your
                    Order ID and create a license. Be sure to have your instance
                    details (IP address, MAC address, or hostname) ready.
                </Text>
            </Section>

            <Section className="text-center mb-[2.5rem]">
                <Link
                    href="http://localhost:8080/web/marketplace/customer-dashboard"
                    className="bg-white border text-black border-black font-bold py-2 px-6 rounded-lg text-base no-underline inline-block w-[10rem] mr-4"
                >
                    Go to Dashboard
                </Link>
                <Link
                    href="https://console.marketplacedemo.liferay.sh/projects"
                    className="bg-primary text-white font-bold py-2 px-6 rounded-lg text-base no-underline inline-block w-[10rem]"
                >
                    Continue Configuration
                </Link>
            </Section>

            <Section className="text-center px-[7rem] py-1">
                <Link
                    href="https://learn.liferay.com"
                    className="text-primary font-bold text-xl no-underline"
                >
                    Learn more about App Configuration
                </Link>
            </Section>
        </Layout>
    );
}

NextStepsTemplatePaidOrTrial.PreviewProps = {
    commerceOrderId: '123456789',
} as Props;

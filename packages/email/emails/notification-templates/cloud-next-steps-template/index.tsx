import { Text, Heading, Link, Section } from '@react-email/components';

import TrialLayout from '../../components/TrialLayout';

export default function CloudNextStepsTemplate() {
    return (
        <TrialLayout preview="Next Steps">
            <Section className="text-center mb-[35px] mt-[35px]">
                {/* Header built into TrialLayout, but this template has "Next Steps" heading inside content area sort of.
                    Actually TrialLayout has the logo.
                    The original HTML has logo then "Next Steps".
                */}
            </Section>

            <Heading
                as="h2"
                className="text-[30px] font-bold m-0 mb-4 mt-[2.5rem] text-black"
            >
                Next Steps
            </Heading>

            <Section className="text-center mx-[11rem] mb-[2.5rem]">
                {/* 11rem is roughly 176px. TrialLayout has px-[112px] (7rem).
                     Original has margin: 0 11rem.
                     I might need to override padding.
                 */}
                <Text className="text-text text-center m-0 mb-4">
                    Congratulations on the purchase of{' '}
                    <b>[%GETAPPINFORMATION_PRODUCTNAME%]</b>. You will need to
                    deploy the app to your project in the Cloud Console. To
                    access the Cloud Console, click the button below and provide
                    your Order ID when prompted.
                </Text>
                <Text className="text-text text-center m-0">
                    Your Order ID is:{' '}
                    <b className="text-black">[%GETAPPINFORMATION_ORDERID%]</b>
                </Text>
            </Section>

            <Section className="text-center mb-[2.5rem]">
                <Link
                    href="[%GETAPPINFORMATION_DASHBOARDLINK%]"
                    className="bg-primary text-white font-bold py-2 px-6 rounded-lg text-base no-underline inline-block w-[10rem]"
                >
                    Go to Dashboard
                </Link>
            </Section>
        </TrialLayout>
    );
}

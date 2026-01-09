import { Text, Heading, Link, Section } from '@react-email/components';

import TrialLayout from '../../components/TrialLayout';

export default function TrialAdminExtensionResponse() {
    return (
        <TrialLayout preview="Trial Extension Response" style={{ maxWidth: '640px' }}>
             <Section className="mb-6">
             </Section>

             <Section>
                <Text className="text-base text-text mb-4">
                    Dear <span className="font-bold">[%TRIALEXTENSIONREQUEST_AUTHOR_FIRST_NAME%]</span>,
                </Text>

                <Text className="text-base text-text mb-4">
                    Your request for <span className="font-bold">[%TRIALEXTENSIONREQUEST_PROJECTID%]</span> was <span className="font-bold">[%TRIALEXTENSIONREQUEST_DUESTATUS%]</span> by the admin.
                </Text>

                <Text className="text-base text-text mb-4">
                    Please go to the dashboard for details and approval.
                </Text>

                <Text className="text-base text-text mb-8">
                    Regards,<br />
                    The Liferay Marketplace Team
                </Text>

                 <Section className="text-center">
                    <Link href="http://localhost:8080/web/marketplace/ssa-dashboard" className="bg-primary text-white font-bold py-2 px-6 rounded-lg text-base no-underline inline-block w-[10rem]">
                        Go to Dashboard
                    </Link>
                </Section>
             </Section>
        </TrialLayout>
    );
}

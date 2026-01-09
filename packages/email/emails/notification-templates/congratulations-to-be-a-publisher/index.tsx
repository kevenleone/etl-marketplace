import { Text, Heading, Link, Section, Img, Column, Row, Hr } from '@react-email/components';

import Layout from '../../components/Layout';

export default function CongratulationsToBeAPublisher() {
    return (
        <Layout preview="Congratulations on Becoming a Publisher">
             <Heading className="text-[32px] font-bold text-heading mb-6 text-center">Congratulations!</Heading>
             
             <Section className="mb-6">
                <Row>
                    <Column width="58">
                        <Img src="[%PUBLISHER_IMAGE%]" width="58" height="58" alt="App Icon" className="rounded-full block" />
                    </Column>
                    <Column className="pl-3">
                        <Text className="text-[28px] font-semibold text-heading m-0">[%PUBLISHER_NAME%]</Text>
                        <Text className="text-base text-text m-0">[%CATALOG_NAME%]</Text>
                    </Column>
                </Row>
             </Section>

             <Section className="mb-6">
                <Text className="text-base text-text m-0 mb-4">
                    Dear <span className="font-bold">[%PUBLISHER_NAME%]</span>
                </Text>
                <Text className="text-base text-text m-0">
                    Congratulations! Your application to become a publisher on the Liferay Marketplace has been approved. You can now publish your solutions and reach a global audience of Liferay users and organizations. Welcome aboard!
                </Text>
             </Section>
             
             <Section>
                 <Text className="text-base text-text font-bold m-0">What's next?</Text>
                 <Hr className="border-border my-4" />
             </Section>

             <Section className="mb-4">
                 <Text className="text-base text-text m-0 mb-4">Publishing your first app is just a few steps away:</Text>
                 
                 <div className="mb-6">
                     <Text className="text-base text-text font-bold m-0 mb-1">1. Log in to your Publisher Account</Text>
                     <Text className="text-base text-text m-0 mb-4">Access your dedicated publisher dashboard by clicking the button below.</Text>
                     <Link href="https://marketplace.liferay.com/publisher-dashboard#/app/[%CPDEFINITION_PRODUCTID%]" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block">
                        Go to Dashboard
                    </Link>
                 </div>

                 <div className="mb-6">
                     <Text className="text-base text-text font-bold m-0 mb-1">2. Prepare your Application</Text>
                     <Text className="text-base text-text m-0">
                        Ensure your app is packaged correctly and meets all Liferay Marketplace guidelines. You can find detailed documentation and best practices <Link href="#" className="font-semibold text-primary no-underline">here</Link>
                     </Text>
                 </div>

                 <div className="mb-6">
                     <Text className="text-base text-text font-bold m-0 mb-1">3. Submit Your App</Text>
                     <Text className="text-base text-text m-0">
                        Follow the intuitive submission process within your publisher dashboard. You'll be guided through providing details, screenshots, pricing, and more.
                     </Text>
                 </div>

                 <div className="mb-6">
                     <Text className="text-base text-text font-bold m-0 mb-1">4. Review Process</Text>
                     <Text className="text-base text-text m-0">
                        Our team will review your submission to ensure it meets our quality and security standards. We'll notify you once it's approved and live on the Marketplace.
                     </Text>
                 </div>
             </Section>

             <Section>
                 <Text className="text-base text-text font-bold m-0 mb-1">Help Publisher</Text>
                 <Hr className="border-border my-4" />
                 <Text className="text-base text-text m-0 mb-4">
                    We're here to support you at every step. For any questions or assistance with your application, contact our <span className="font-bold">Publisher Support team</span> by clicking the button below.
                 </Text>
                 <Link href="https://marketplace.liferay.com/publisher-dashboard#/app/[%CPDEFINITION_PRODUCTID%]" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg text-base no-underline inline-block">
                        Support
                </Link>
             </Section>

             <Section className="mt-12 mb-6">
                <Text className="text-base text-text m-0">
                    We look forward to seeing your innovative solutions on the <span className="font-bold">Liferay Marketplace!</span><br/>
                    Best regards,<br/>
                    The Liferay Marketplace Team
                </Text>
             </Section>

        </Layout>
    );
}

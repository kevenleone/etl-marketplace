import { Text, Heading, Link, Section, Img, Column, Row, Hr } from '@react-email/components';

import Layout from '../../components/Layout';

export default function InvoicePaymentTemplate() {
    return (
        <Layout preview="New Order Placed">
             <Heading className="text-2xl font-bold text-heading m-0 mb-6">New Order Placed</Heading>
             
             <Text className="text-base text-text m-0 mb-6">
                A new order has been successfully placed by the <span className="font-bold">[%ACCOUNT_NAME%]</span>. Below you can find the order and account details for Finance review and processing.
             </Text>

             <Text className="text-base font-bold text-[#3f404b] m-0 mb-2 block">Order Detail</Text>
             <Hr className="border-[#e2e2e4] my-2 mb-4" />

             <Text className="text-sm m-0">Order ID: <span className="font-bold">[%ORDER_ID%]</span></Text>
             <Text className="text-sm m-0">Order Date: <span className="font-bold">[%ORDER_DATE%]</span></Text>
             <Text className="text-sm m-0">Order Payment Method: <span className="font-bold">[%ORDER_PAYMENT_METHOD%]</span></Text>
             <Text className="text-sm m-0 mb-4">Order Status: <span className="font-bold">[%ORDER_STATUS%]</span></Text>

             <Section className="mb-4">
                <Row>
                    <Column width="56">
                        <Img src="[%PRODUCT_THUMBNAIL%]" width="56" height="56" alt="App Icon" className="rounded-lg block" />
                    </Column>
                    <Column className="pl-3">
                        <Heading as="h2" className="text-lg text-heading m-0">[%APP_NAME%]</Heading>
                        <div className="mt-1">
                             <span className="text-sm text-text m-0">[%CATALOG_NAME%]</span>
                             <span className="border border-[#2E5AAC] text-[#2E5AAC] rounded px-2 py-0.5 text-xs ml-2">[%APP_TYPE%]</span>
                        </div>
                    </Column>
                </Row>
             </Section>
             
             <Text className="text-base font-bold text-[#3f404b] m-0 mt-4 block">Order Summary</Text>
             <Hr className="border-[#e2e2e4] my-2 mb-4" />

             <Section className="text-[#282934] text-sm mb-4">
                 <Row>
                     <Column align="left">Net Price:</Column>
                     <Column align="right" className="font-bold">[%NET_PRICE_FORMATTED%]</Column>
                 </Row>
                 <Row>
                     <Column align="left">VAT:</Column>
                     <Column align="right" className="font-bold">[%VAT_FORMATTED%]</Column>
                 </Row>
                 <Row>
                     <Column align="left">Total:</Column>
                     <Column align="right" className="font-bold">[%TOTAL_FORMATTED%]</Column>
                     <Column width="100">
                        <span className="bg-[#E6EBF5] text-[#1C3667] text-[11px] rounded px-2 py-0.5 ml-2">[%LICENSE_TYPE%]</span>
                     </Column>
                 </Row>
                 <Row>
                     <Column align="left">Exchange Rate:</Column>
                     <Column align="right" className="font-bold">
                        [%EXCHANGE_RATE%]
                     </Column>
                     <Column width="20">
                         <span title="Exchange rate applied on [%ORDER_DATE%]" className="border border-[#1C3667] text-[#1C3667] rounded-full text-[13px] font-bold w-4 h-4 text-center inline-block ml-1 cursor-help">?</span>
                     </Column>
                 </Row>
             </Section>

             <Text className="text-base font-bold text-[#3f404b] m-0 mt-6 block">Account Details</Text>
             <Hr className="border-[#e2e2e4] my-2 mb-4" />
             
             <Text className="text-sm m-0">Account Name: <span className="font-bold">[%ACCOUNT_NAME%]</span></Text>
             <Text className="text-sm m-0">Account ID: <span className="font-bold">[%ACCOUNT_ID%]</span></Text>
             <Text className="text-sm m-0">Tax/VAT ID: <span className="font-bold">[%VAT_NUMBER%]</span></Text>
             <Text className="text-sm m-0 mb-4">Payment Terms: <span className="font-bold">[%PAYMENT_TERMS%]</span></Text>

             <Text className="text-base font-bold text-[#3f404b] m-0 mt-6 block">Billing Address</Text>
             <Hr className="border-[#e2e2e4] my-2 mb-4" />

             <Text className="text-base font-bold text-[#3f404b] m-0 block">[%BILLING_ADDRESS_NAME%]</Text>
             <Text className="text-sm text-[#54555F] m-0 mb-4">[%BILLING_ADDRESS_FORMATTED%]</Text>

             <Text className="text-base font-bold text-[#3f404b] m-0 mt-0 block">Billing Contact</Text>
             <Hr className="border-[#e2e2e4] my-2 mb-4" />

             <Text className="text-sm m-0">Contact Person: <span className="font-bold">[%BILLING_ADDRESS_NAME%]</span></Text>
             <Text className="text-sm m-0">E-mail: <span className="font-bold">[%EMAIL_ADDRESS%]</span></Text>
             <Text className="text-sm m-0 mb-4">Phone Number: <span className="font-bold">[%BILLING_ADDRESS_PHONE%]</span></Text>

        </Layout>
    );
}

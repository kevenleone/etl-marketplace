import {
    Text,
    Heading,
    Link,
    Section,
    Img,
    Column,
    Row,
    Hr,
} from '@react-email/components';

import Layout from '../../components/Layout';

type Props = {
    accountId: string;
    accountName: string;
    appName: string;
    appType: string;
    billingAddressFormatted: string;
    billingAddressName: string;
    billingAddressPhone: string;
    catalogName: string;
    emailAddress: string;
    exchangeRate: string;
    licenseType: string;
    netPriceFormatted: string;
    orderDate: string;
    orderId: string;
    orderPaymentMethod: string;
    orderStatus: string;
    paymentTerms: string;
    productThumbnail: string;
    totalFormatted: string;
    vatFormatted: string;
    vatNumber: string;
};

export default function InvoicePaymentTemplate({
    accountId = '[%ACCOUNT_ID%]',
    accountName = '[%ACCOUNT_NAME%]',
    appName = '[%APP_NAME%]',
    appType = '[%APP_TYPE%]',
    billingAddressFormatted = '[%BILLING_ADDRESS_FORMATTED%]',
    billingAddressName = '[%BILLING_ADDRESS_NAME%]',
    billingAddressPhone = '[%BILLING_ADDRESS_PHONE%]',
    catalogName = '[%CATALOG_NAME%]',
    emailAddress = '[%EMAIL_ADDRESS%]',
    exchangeRate = '[%EXCHANGE_RATE%]',
    licenseType = '[%LICENSE_TYPE%]',
    netPriceFormatted = '[%NET_PRICE_FORMATTED%]',
    orderDate = '[%ORDER_DATE%]',
    orderId = '[%ORDER_ID%]',
    orderPaymentMethod = '[%ORDER_PAYMENT_METHOD%]',
    orderStatus = '[%ORDER_STATUS%]',
    paymentTerms = '[%PAYMENT_TERMS%]',
    productThumbnail = '[%PRODUCT_THUMBNAIL%]',
    totalFormatted = '[%TOTAL_FORMATTED%]',
    vatFormatted = '[%VAT_FORMATTED%]',
    vatNumber = '[%VAT_NUMBER%]',
}: Props) {
    return (
        <Layout preview="New Order Placed">
            <Heading className="text-2xl font-bold text-heading m-0 mb-6">
                New Order Placed
            </Heading>

            <Text className="text-base text-text m-0 mb-6">
                A new order has been successfully placed by the{' '}
                <span className="font-bold">{accountName}</span>. Below you can
                find the order and account details for Finance review and
                processing.
            </Text>

            <Text className="text-base font-bold text-[#3f404b] m-0 mb-2 block">
                Order Detail
            </Text>
            <Hr className="border-[#e2e2e4] my-2 mb-4" />

            <Text className="text-sm m-0">
                Order ID: <span className="font-bold">{orderId}</span>
            </Text>
            <Text className="text-sm m-0">
                Order Date: <span className="font-bold">{orderDate}</span>
            </Text>
            <Text className="text-sm m-0">
                Order Payment Method:{' '}
                <span className="font-bold">{orderPaymentMethod}</span>
            </Text>
            <Text className="text-sm m-0 mb-4">
                Order Status: <span className="font-bold">{orderStatus}</span>
            </Text>

            <Section className="mb-4">
                <Row>
                    <Column width="56">
                        <Img
                            src={productThumbnail}
                            width="56"
                            height="56"
                            alt="App Icon"
                            className="rounded-lg block"
                        />
                    </Column>
                    <Column className="pl-3">
                        <Heading as="h2" className="text-lg text-heading m-0">
                            {appName}
                        </Heading>
                        <div className="mt-1">
                            <span className="text-sm text-text m-0">
                                {catalogName}
                            </span>
                            <span className="border border-[#2E5AAC] text-[#2E5AAC] rounded px-2 py-0.5 text-xs ml-2">
                                {appType}
                            </span>
                        </div>
                    </Column>
                </Row>
            </Section>

            <Text className="text-base font-bold text-[#3f404b] m-0 mt-4 block">
                Order Summary
            </Text>
            <Hr className="border-[#e2e2e4] my-2 mb-4" />

            <Section className="text-[#282934] text-sm mb-4">
                <Row>
                    <Column align="left">Net Price:</Column>
                    <Column align="right" className="font-bold">
                        {netPriceFormatted}
                    </Column>
                </Row>
                <Row>
                    <Column align="left">VAT:</Column>
                    <Column align="right" className="font-bold">
                        {vatFormatted}
                    </Column>
                </Row>
                <Row>
                    <Column align="left">Total:</Column>
                    <Column align="right" className="font-bold">
                        {totalFormatted}
                    </Column>
                    <Column width="100">
                        <span className="bg-[#E6EBF5] text-[#1C3667] text-[11px] rounded px-2 py-0.5 ml-2">
                            {licenseType}
                        </span>
                    </Column>
                </Row>
                <Row>
                    <Column align="left">Exchange Rate:</Column>
                    <Column align="right" className="font-bold">
                        {exchangeRate}
                    </Column>
                    <Column width="20">
                        <span
                            title={`Exchange rate applied on ${orderDate}`}
                            className="border border-[#1C3667] text-[#1C3667] rounded-full text-[13px] font-bold w-4 h-4 text-center inline-block ml-1 cursor-help"
                        >
                            ?
                        </span>
                    </Column>
                </Row>
            </Section>

            <Text className="text-base font-bold text-[#3f404b] m-0 mt-6 block">
                Account Details
            </Text>
            <Hr className="border-[#e2e2e4] my-2 mb-4" />

            <Text className="text-sm m-0">
                Account Name: <span className="font-bold">{accountName}</span>
            </Text>
            <Text className="text-sm m-0">
                Account ID: <span className="font-bold">{accountId}</span>
            </Text>
            <Text className="text-sm m-0">
                Tax/VAT ID: <span className="font-bold">{vatNumber}</span>
            </Text>
            <Text className="text-sm m-0 mb-4">
                Payment Terms: <span className="font-bold">{paymentTerms}</span>
            </Text>

            <Text className="text-base font-bold text-[#3f404b] m-0 mt-6 block">
                Billing Address
            </Text>
            <Hr className="border-[#e2e2e4] my-2 mb-4" />

            <Text className="text-base font-bold text-[#3f404b] m-0 block">
                {billingAddressName}
            </Text>
            <Text className="text-sm text-[#54555F] m-0 mb-4">
                {billingAddressFormatted}
            </Text>

            <Text className="text-base font-bold text-[#3f404b] m-0 mt-0 block">
                Billing Contact
            </Text>
            <Hr className="border-[#e2e2e4] my-2 mb-4" />

            <Text className="text-sm m-0">
                Contact Person:{' '}
                <span className="font-bold">{billingAddressName}</span>
            </Text>
            <Text className="text-sm m-0">
                E-mail: <span className="font-bold">{emailAddress}</span>
            </Text>
            <Text className="text-sm m-0 mb-4">
                Phone Number:{' '}
                <span className="font-bold">{billingAddressPhone}</span>
            </Text>
        </Layout>
    );
}

InvoicePaymentTemplate.PreviewProps = {
    accountId: '12345',
    accountName: 'Liferay',
    appName: 'Liferay',
    appType: 'SaaS',
    billingAddressFormatted: '123 Main St, Los Angeles, CA 90001',
    billingAddressName: 'John Doe',
    billingAddressPhone: '123-456-7890',
    catalogName: 'Liferay, Inc.',
    emailAddress: 'test@liferay.com',
    exchangeRate: '1.0',
    licenseType: 'Enterprise',
    netPriceFormatted: '$100.00',
    orderDate: '2023-01-01',
    orderId: '123456789',
    orderPaymentMethod: 'Credit Card',
    orderStatus: 'Completed',
    paymentTerms: 'Net 30',
    productThumbnail: 'https://github.com/liferay.png',
    totalFormatted: '$110.00',
    vatFormatted: '$10.00',
    vatNumber: '123456789',
} as Props;

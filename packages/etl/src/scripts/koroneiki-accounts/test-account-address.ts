import { postAccountPostalAddress } from 'liferay-headless-rest-client/headless-admin-user-v1.0';
import { liferayClient } from '../../services/liferay';

for (const num of new Array(10)) {
    const response = await postAccountPostalAddress({
        body: {
            addressCountry: 'United States',
            addressLocality: 'Chicago',
            postalCode: '60606-5312',
            streetAddressLine1: '227 West Monroe Street',
            streetAddressLine2: '',
            streetAddressLine3: '',
            addressType: 'billing-and-shipping',
            addressRegion: 'Illinois',
            primary: true,
        },
        client: liferayClient,
        path: { accountId: '42436858' },
    });

    console.log(response);
}

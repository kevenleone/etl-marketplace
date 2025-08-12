select oae.appEntryId, oal.name, oapi.price, oce.currencyCode, oal.usageType
from lportal.OSB_AppEntry oae, lportal.OSB_AppVersion oav,lportal.OSB_CountryAppPricing ocap, lportal.OSB_AppPricingItem oapi,lportal.OSB_AssetLicense oal,
OSB_CurrencyEntry oce,
(select oav.appEntryId, version, max(versionorder) max_versionorder from lportal.OSB_AppVersion oav
where status = 0 group by oav.appEntryId, oav.version) oavmax
where oae.appEntryId  = oav.appEntryId
and oav.appEntryId  = oavmax.appEntryId
and oav.version = oavmax.version
and oav.versionOrder = oavmax.max_versionorder
and oav.version  = oae.version
and oav.status = 0
and oae.licenseType  = oal.licenseType 
and ocap.appEntryId  = oae.appEntryId 
and ocap.appVersionId  = oav.appVersionId 
and ocap.countryId  = 19
and oapi.appPricingId  = ocap.appPricingId 
and oal.status  = 0
and oal.classNameId  = 11327275
and oal.classPK  = oav.appVersionId 
and oal.assetLicenseId  = oapi.assetLicenseId 
and oce.currencyEntryId  = oapi.currencyEntryId 
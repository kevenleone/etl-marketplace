select ifnull(profileLogoId, 0) as profileLogoId, 
developerEntryId, firstName, lastName, ifnull(legalEntityName, '') as legalEntityName ,
ode.userId, ifnull(dossieraAccountKey, '') as dossieraAccountKey, type_ , 
extractvalue(ifnull(profileDescription, ''), '//text()') as profileDescription, emailAddress,
ifnull(profileWebsite, '') as profileWebsite, ifnull(paymentEmailAddress, ''), 
ifnull(odei.name, '') as industry, ifnull(a.street1, '') as street1, 
ifnull(a.street2, '') as street2 , 
ifnull(a.street3, '') as street3, 
ifnull(c.name, '') as country, 
ifnull(c.a2, '') as a2,
ifnull(r.name, '') as region , 
ifnull(r.regionCode, '') as regionCode , 
ifnull(a.city, '') as city , 
ifnull(a.zip, '') as zip, 
ifnull(phoneNumber, '') as phoneNumber 
from OSB_DeveloperEntry ode left join  OSB_DeveloperEntryIndustry odei
on ode.developerEntryIndustryId  = odei.developerEntryIndustryId
left join Address a
on a.addressId  = ode.addressId
left join Country c
on a.countryId  = c.countryId
left join Region r
on a.regionId  = r.regionId
WHERE STATUS = 0
and exists (select * from OSB_AppEntry oae WHERE oae.status = 0 AND oae.developerEntryId = ode.developerEntryId);
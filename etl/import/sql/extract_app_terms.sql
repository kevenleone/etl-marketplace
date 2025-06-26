select oav.appentryId, extractvalue(oce.content, '//text()') as content 
from OSB_ContractEntry oce, lportal.OSB_AppVersion oav
WHERE oav.contractEntryId  = oce.contractEntryId;
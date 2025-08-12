select distinct oae.developerEntryId , filename,  oaa.assetAttachmentId
from lportal.OSB_AppEntry oae, lportal.OSB_AssetAttachment oaa
where
oae.status = 0
and oae.developerEntryId  = oaa.classPK
and oaa.classNameId = 16290272
and type_ = 5
order by oae.developerEntryId, rank;
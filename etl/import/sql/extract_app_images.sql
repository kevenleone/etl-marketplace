select oae.appEntryId, filename,  oaa.assetAttachmentId, type_
from lportal.OSB_AppEntry oae, lportal.OSB_AppVersion oav,lportal.OSB_AssetAttachment oaa,
(select oav.appEntryId, version, max(versionorder) max_versionorder from lportal.OSB_AppVersion oav
where status = 0 group by oav.appEntryId, oav.version) oavmax
where oae.appEntryId  = oav.appEntryId
and oav.appEntryId  = oavmax.appEntryId
and oav.version = oavmax.version
and oav.versionOrder = oavmax.max_versionorder
and oav.version  = oae.version
and oav.status = 0
and oav.appVersionId  = oaa.classPK
and oaa.classNameId = 11327275
and type_ in (1,2)
order by oae.appEntryId, rank;
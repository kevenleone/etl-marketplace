select oae.appEntryId, oae.title, extractvalue(oav.description, '//text()') as description, oav.version, 
concat("https://web.liferay.com/marketplace/-/mp/asset/icon/", oae.appEntryId, "/", oav.version, "?p_p_cacheability=cacheLevelPage") as iconurl, oae.developerName,
date_format(convert_tz(oav.releaseDate, '+00:00', '-07:00'), '%Y-%m-%d') as releaseDate,
oae.developerEntryId, oae.licenseType, extractvalue(oav.changelog, '//text()') as changelog,
oae.supportWebsite, oae.referenceWebsite, oae.documentationWebsite, oae.sourceCodeWebsite,oae.website, oae.status,
date_format(convert_tz(oae.createDate, '+00:00', '-07:00'), '%Y-%m-%d') as createDate,
date_format(convert_tz(oae.statusVersionDate, '+00:00', '-07:00'), '%Y-%m-%d') as statusVersionDate,
oae.downloadCount, oav.appVersionId as latestAppVersionId
from lportal.OSB_AppEntry oae, lportal.OSB_AppVersion oav,
(select oav.appEntryId, version, max(versionorder) max_versionorder from lportal.OSB_AppVersion oav 
where status = 0 and hidden_ = 0 group by oav.appEntryId, oav.version) oavmax
where oae.appEntryId  = oav.appEntryId
and oav.appEntryId  = oavmax.appEntryId
and oav.version = oavmax.version
and oav.versionOrder = oavmax.max_versionorder
and oav.version  = oae.version
and oav.status = 0
and oae.hidden_ = 0
and oav.hidden_ = 0
and oae.status = 0
order by oae.appEntryId
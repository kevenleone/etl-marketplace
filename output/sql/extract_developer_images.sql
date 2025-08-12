select ode.developerEntryId,
g.friendlyURL,
oce.logoId,
concat("https://web.liferay.com/web", g.friendlyURL, "/profile?p_p_id=2_WAR_osbcorpprofileportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=serveMedia&p_p_cacheability=cacheLevelPage&p_p_col_id=column-1&p_p_col_count=1&_2_WAR_osbcorpprofileportlet_assetAttachmentId=", oce.logoId) as url, oce.description,
oaa.filename
from lportal.OSB_DeveloperEntry ode,
lportal.OSB_CorpEntry oce,
lportal.Group_ g,
lportal.OSB_AssetAttachment oaa
where g.classPK  = oce.organizationId
AND oaa.classNameId  = 12291273
AND oaa.TYPE_ = 2
AND oce.corpEntryId  = oaa.classPK 
and ode.dossieraAccountKey  = oce.dossieraAccountKey
and oce.status = 0 and ode.status = 0;
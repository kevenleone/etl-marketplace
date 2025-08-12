select  oae.appEntryId, opr.buildnumber, opr.ee, oap.appPackageId, oav.version, opr.hidden_,
oav.status,
 oav.appVersionId, opr.versionName,
 date_format(convert_tz(oav.releaseDate, '+00:00', '-07:00'), '%Y-%m-%d') as releaseDate,
 extractvalue(oav.changeLog, '//text()') as changelog, oap.compatibilityPlus,
 date_format(convert_tz(oav.createDate, '+00:00', '-07:00'), '%Y-%m-%d') as createDate,
 oav.userName, oav.downloadCount,
 extractvalue(oav.description, '//text()') as description,
 oav.documentationWebsite, oaa.assetAttachmentId, oaa.fileName
from lportal.OSB_AppEntry oae,
 lportal.OSB_AppVersion oav,
 lportal.OSB_PortalRelease opr,
 lportal.OSB_AppPackage oap
 left join
  lportal.OSB_AssetAttachment oaa
  on oaa.classPK = oap.appPackageId
  and oaa.type_ = 6
  and oaa.classNameId = 11327274
where oae.appEntryId  = oav.appEntryId
AND oap.appVersionId  = oav.appVersionId
and opr.buildNumber  = oap.compatibility
and oav.hidden_ = 0
and oae.hidden_ = 0
and oav.status = 0
order by oae.appentryId, oav.releaseDate  desc;

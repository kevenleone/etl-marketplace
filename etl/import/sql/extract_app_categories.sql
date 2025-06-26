select oae.appEntryId, ac.name from
AssetEntry ae, AssetEntries_AssetCategories aeac, AssetCategory ac, lportal.OSB_AppEntry oae
where classnameId  = 11327273
and ae.classPk = oae.appEntryId
AND ae.entryId  = aeac.entryId
and aeac.categoryId  = ac.categoryId
and ac.parentCategoryId  <> 0;
public without sharing class EmailAdvancedSearchController {
        
    @AuraEnabled
    public static List<ContentVersion> searchEmails(Id engagementId, Date dateFrom, Date dateUntil, String fromAddress, String toAddress, String keywords, String category, Integer limitRecords, Integer offsetRecords, List<String> businessUnitIdList, List<Id> engagementIdList) {
        
        List<Id> contVerIds = new List<Id>();
        Boolean applyTextAreaFilters = false;
        if (!String.isBlank(keywords) || !String.isBlank(fromAddress) || !String.isBlank(toAddress)) {
            applyTextAreaFilters = true;
            string queryString =  '"' + keywords + '"' + ' AND ' + '"' + fromAddress + '"' + ' AND ' + '"' + toAddress + '"';
            
            List<List<SObject>> searchList = [FIND :queryString IN ALL FIELDS RETURNING ContentVersion(Id)];
            List<ContentVersion> contVersionList = (List<ContentVersion>) searchList[0];
            
            for (ContentVersion contVersion : contVersionList) {
                contVerIds.add(contVersion.Id);
            }
        }        
        
        List<ContentDocumentLink> contDocLinkList;
        if (engagementIdList.size() == 1 && engagementIdList[0] == engagementId) {

            if (!businessUnitIdList.isEmpty() && businessUnitIdList[0] != 'All Business Units') {
                contDocLinkList = [SELECT ContentDocumentId  FROM ContentDocumentLink WHERE LinkedEntityId IN :businessUnitIdList];                        
            } else {
                contDocLinkList = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId IN (SELECT Id FROM Business_Unit__c WHERE Engagement__c = :engagementId)];
            }           

        } else {
            contDocLinkList = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId IN (SELECT Id FROM Business_Unit__c WHERE Engagement__c IN :engagementIdList)];
        }

        List<Id> contDocIdList = new List<Id>();
        for (ContentDocumentLink documentLink : contDocLinkList) {
            contDocIdList.add(documentLink.ContentDocumentId);
        }
        
        Id emailRecordTypeId = Schema.SObjectType.ContentVersion.getRecordTypeInfosByName().get('Email').getRecordTypeId();
        String soqlQuery = 'SELECT Id, Title, Description, CreatedDate, Recipients_From__c, Recipients_To__c, Recipients_Cc__c, Comments__c, Categories__c  FROM ContentVersion WHERE ContentDocumentId IN :contDocIdList AND RecordTypeId = :emailRecordTypeId  AND IsLatest = true';

        if (applyTextAreaFilters) {
            soqlQuery += ' AND Id IN :contVerIds';
        }
        
        if (!String.isBlank(String.valueOf(dateFrom))) {
            dateFrom = dateFrom.addDays(-1);
            soqlQuery += ' AND CreatedDate >= :dateFrom';
        }

        if (!String.isBlank(String.valueOf(dateUntil))) {            
            dateUntil = dateUntil.addDays(1);             
            soqlQuery += ' AND CreatedDate <= :dateUntil';
        }

        if (!String.isBlank(category) && category != 'All Categories') {
            soqlQuery += ' AND Categories__c INCLUDES (:category)';
        }
        
        soqlQuery += ' ORDER BY CreatedDate DESC LIMIT :limitRecords OFFSET :offsetRecords'; 
        List<ContentVersion> finalResultList = Database.query(soqlQuery);
        
        return finalResultList;
        
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Business_Unit__c> getBusinessUnitsOfEngagement(Id engagementId){
        
        List<Business_Unit__c> businessUnitList = [SELECT Id, Name, Parent_Object_Name__c 
                                                   FROM Business_Unit__c 
                                                   WHERE Engagement__c = :EngagementId 
                                                   ORDER BY Parent_Object_Name__c ASC];
        return businessUnitList;
        
    }
    
    @AuraEnabled
    public static Integer countTotalEmails(Id engagementId, Date dateFrom, Date dateUntil, String fromAddress, String toAddress, String keywords, String category, List<String> businessUnitIdList, List<Id> engagementIdList) {
        
        System.debug('>>> ENTRO EN EL METODO');
        List<Id> contVerIds = new List<Id>();
        Boolean applyTextAreaFilters = false;
        if (!String.isBlank(keywords) || !String.isBlank(fromAddress) || !String.isBlank(toAddress)) {
            System.debug('>>> HIZO CONSULTA SOSL');
            applyTextAreaFilters = true;
            string queryString =  '"' + keywords + '"' + ' AND ' + '"' + fromAddress + '"' + ' AND ' + '"' + toAddress + '"';
            
            List<List<SObject>> searchList = [FIND :queryString IN ALL FIELDS RETURNING ContentVersion(Id)];
            List<ContentVersion> contVersionList = (List<ContentVersion>) searchList[0];
            
            for (ContentVersion contVersion : contVersionList) {
                contVerIds.add(contVersion.Id);
            }
        }        
        
        System.debug('>>> ENTRANDO EN FILTRO ENGAGEMENT - BUS');
        List<ContentDocumentLink> contDocLinkList;
        if (engagementIdList.size() == 1 && engagementIdList[0] == engagementId) {
			System.debug('>>> ENTRO EN QUE ES SOLO UN ENGAGEMENT');
            System.debug('>>> EL ENGAGEMENT ES -----> ' + engagementIdList[0]);
            if (!businessUnitIdList.isEmpty() && businessUnitIdList[0] != 'All Business Units') {
                System.debug('>>> ENTRO EN QUE SON CIERTAS BUSINESS UNITS');
                System.debug('>>> LAS BUSINESS UNITS SON:');
                System.debug(businessUnitIdList);
                contDocLinkList = [SELECT ContentDocumentId  FROM ContentDocumentLink WHERE LinkedEntityId IN :businessUnitIdList];                        
            } else {
                System.debug('>>> ENTRO EN QUE SON All Business Units');
                System.debug('>>> TODAS LAS BUSINESS UNITS CUYO ENGAGEMENT SEA: ---->' + engagementId);
                System.debug('>>> LAS BUSINESS UNITS SON:');
                for (Business_Unit__c bu : [SELECT Id, Name FROM Business_Unit__c WHERE Engagement__c = :engagementId]) {
                    System.debug(bu.Id);
                    System.debug(bu.Name);
                    System.debug('-------------------------------');
                }
                contDocLinkList = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId IN (SELECT Id FROM Business_Unit__c WHERE Engagement__c = :engagementId)];
                
            }           

        } else {
            System.debug('>>> ENTRO EN QUE SON VARIOS ENGAGEMENT');
            System.debug('>>> LOS ENGAGEMENTS SON:');
            System.debug(engagementIdList);
            contDocLinkList = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId IN (SELECT Id FROM Business_Unit__c WHERE Engagement__c IN :engagementIdList)];
        }

        List<Id> contDocIdList = new List<Id>();
        for (ContentDocumentLink documentLink : contDocLinkList) {
            contDocIdList.add(documentLink.ContentDocumentId);
        }
        
        Id emailRecordTypeId = Schema.SObjectType.ContentVersion.getRecordTypeInfosByName().get('Email').getRecordTypeId();
        String soqlQuery = 'SELECT COUNT(Id)RecordCount FROM ContentVersion WHERE ContentDocumentId IN :contDocIdList AND RecordTypeId = :emailRecordTypeId  AND IsLatest = true';

        if (applyTextAreaFilters) {
            System.debug('>>> APLICO LOS FILTROS DE KEYWORDS');
            soqlQuery += ' AND Id IN :contVerIds';
        }
        
        if (!String.isBlank(String.valueOf(dateFrom))) {
            dateFrom = dateFrom.addDays(-1);
            soqlQuery += ' AND CreatedDate >= :dateFrom';            
            System.debug('>>> APLICO FILTRO dateFrom ---> ' + dateFrom);
        }

        if (!String.isBlank(String.valueOf(dateUntil))) {            
            dateUntil = dateUntil.addDays(1);             
            soqlQuery += ' AND CreatedDate <= :dateUntil';
            System.debug('>>> APLICO FILTRO dateUntil ---> ' + dateUntil);
        }

        if (!String.isBlank(category) && category != 'All Categories') {
            soqlQuery += ' AND Categories__c INCLUDES (:category)';
            System.debug('>>> APLICO FILTRO category ---> ' + category);
        }
        
        AggregateResult[] groupedResults = Database.query(soqlQuery);
        Integer emailCount = (Integer) groupedResults[0].get('RecordCount');
        System.debug('>>> LA CUENTA FINAL ES ---> ' + emailCount);
        
        return emailCount;
        
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Engagement__c> getSiblingEngagements(Id engagementId){
        
        List<Engagement__c> originalEngagement = [SELECT Account__c FROM Engagement__c WHERE Id = :engagementId LIMIT 1];
        Id accountId = originalEngagement[0].Account__c;
        List<Engagement__c> engagementList = [SELECT Name, Name__c FROM Engagement__c WHERE Account__c = :accountId ORDER BY Name__c ASC];
        return engagementList;
        
    }

}
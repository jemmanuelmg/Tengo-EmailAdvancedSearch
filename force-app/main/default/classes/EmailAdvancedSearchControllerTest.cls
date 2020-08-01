@isTest
public class EmailAdvancedSearchControllerTest {
    
    @testSetup 
    static void setup() {
        
        Account account = TestDataFactory.createAccount('Test Account');
        insert account;
        
        Engagement__c engagement = TestDataFactory.createEngagement('Test Engagement', account);
        insert engagement;
        
        Business_Unit__c businessUnit = TestDataFactory.createBusinessUnit(engagement, 'Test Business Unit', 'Pending');
        insert businessUnit;
        
        ContentVersion contentVersion = TestDataFactory.createContentVersionAndContentDocument('Test Title AAAA', 'Test Body AAAA');
        ContentVersion contentVersion2 = TestDataFactory.createContentVersionAndContentDocument('Test Title BBBB', 'Test Body BBBB');
        List<ContentVersion> contVersionList = new List<ContentVersion>{contentVersion, contentVersion2};
        insert contVersionList;
        
        ContentDocument contentDocument = [SELECT Id FROM ContentDocument WHERE LatestPublishedVersionId = :contentVersion.Id];
        ContentDocument contentDocument2 = [SELECT Id FROM ContentDocument WHERE LatestPublishedVersionId = :contentVersion2.Id];
        
        ContentDocumentLink contDocLink = TestDataFactory.createContentDocumentLink(contentDocument.Id, businessUnit.Id);
        insert contDocLink;
        
        ContentDocumentLink contDocLink2 = TestDataFactory.createContentDocumentLink(contentDocument2.Id, businessUnit.Id);
        insert contDocLink2;
        
    }
    
    @isTest
    static void testSearchEmailsOnlyDateFromAndDateUntil() {
        
        Engagement__c engagement = [SELECT Id FROM Engagement__c];
        List<Id> engagementIdList = new List<Id>{engagement.Id};
        List<String> emptyBUIdList = new List<String>();
        String todayParam = String.valueOf(Date.today().year()) + '-' + String.valueOf(Date.today().month()) + '-' + String.valueOf(Date.today().day()) ; 
        
        Test.startTest();
        	List<ContentVersion> contVersionList = EmailAdvancedSearchController.searchEmails(engagement.Id, Date.valueOf('1998-06-28'), Date.valueOf(todayParam), '', '', '', '', 100, 0, emptyBUIdList, engagementIdList);
        Test.stopTest();
        
        System.assertEquals(2, contVersionList.size(), 'Expected to have 2 emails returned');
        
    }
    
    @isTest
    static void testSearchEmailsAllFilters() {
        
        Engagement__c engagement = [SELECT Id FROM Engagement__c];
        List<Id> engagementIdList = new List<Id>{engagement.Id};
        Map<String, Business_Unit__c> buMap = new Map<String, Business_Unit__c>([SELECT Id, Name FROM Business_Unit__c]);
        List<String> buIdList = new List<String>(buMap.keySet());
        
        ContentVersion contentVersion = [SELECT Recipients_From__c, Recipients_To__c, Categories__c FROM ContentVersion WHERE Title = 'Test Title AAAA'];
        String fromAddress = contentVersion.Recipients_From__c;
        String toAddress = contentVersion.Recipients_To__c;
        String categories = contentVersion.Categories__c;
        
        String todayParam = String.valueOf(Date.today().year()) + '-' + String.valueOf(Date.today().month()) + '-' + String.valueOf(Date.today().day()) ; 
        System.debug('>>> todayParam es:: ');
        System.debug(todayParam);
        
        Test.startTest();
        	List<ContentVersion> contVersionList = EmailAdvancedSearchController.searchEmails(engagement.Id, Date.valueOf('1998-06-28'), Date.valueOf(todayParam), fromAddress, toAddress, 'Test Body AAAA', categories, 100, 0, buIdList, engagementIdList);
        Test.stopTest();
        
        List<ContentVersion> lala = [SELECT Id, CreatedDate FROM ContentVersion];
        System.debug('>>> La lista completa de contentVersions que hay ');
        System.debug(lala);
        
        System.assertEquals(1, contVersionList.size(), 'Expected to have 1 email returned');  
        
    }
    
    @isTest
    static void testSearchEmailsNegative() {
        
        Engagement__c engagement = [SELECT Id FROM Engagement__c];
        List<Id> engagementIdList = new List<Id>{engagement.Id};
        List<String> emptyBUIdList = new List<String>();
        String todayParam = String.valueOf(Date.today().year()) + '-' + String.valueOf(Date.today().month()) + '-' + String.valueOf(Date.today().day()) ; 
        
        Test.startTest();
        	List<ContentVersion> contVersionList = EmailAdvancedSearchController.searchEmails(engagement.Id, Date.valueOf('1998-06-28'), Date.valueOf(todayParam), '', '', 'RE: Reminder Client Meeting', '', 100, 0, emptyBUIdList, engagementIdList);
        Test.stopTest();
        
        System.assertEquals(0, contVersionList.size(), 'Expected to have 0 emails returned');
        
    }
    
    @isTest
    static void testCountTotalEmails() {
        
        Engagement__c engagement = [SELECT Id FROM Engagement__c];
        List<Id> engagementIdList = new List<Id>{engagement.Id};
        List<String> emptyBUIdList = new List<String>();
        String todayParam = String.valueOf(Date.today().year()) + '-' + String.valueOf(Date.today().month()) + '-' + String.valueOf(Date.today().day()) ; 
        
        Test.startTest();
        	Integer count = EmailAdvancedSearchController.countTotalEmails(engagement.Id, Date.valueOf('1998-06-28'), Date.valueOf(todayParam), '', '', '', '', emptyBUIdList, engagementIdList);
        Test.stopTest();
        
        System.assertEquals(2, count, 'Expected to have 2 emails returned');
        
    }
    
    @isTest
    static void testgGetSiblingEngagements() {
        
        Engagement__c engagement = [SELECT Id FROM Engagement__c];
        
        Test.startTest();
        	List<Engagement__c> engagementList = EmailAdvancedSearchController.getSiblingEngagements(engagement.Id);
        Test.stopTest();
        
        System.assertEquals(1, engagementList.size(), 'Expected to have 1 engagement returned');
        
    }

}
import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import searchEmails from '@salesforce/apex/EmailAdvancedSearchController.searchEmails';
import getBusinessUnitsOfEngagement from '@salesforce/apex/EmailAdvancedSearchController.getBusinessUnitsOfEngagement';
import countTotalEmails from '@salesforce/apex/EmailAdvancedSearchController.countTotalEmails';
import getRelatedEngagements from '@salesforce/apex/EmailAdvancedSearchController.getRelatedEngagements';

const ACTIONS = [

    { label: 'Details', name: 'details' },
    { label: 'Download', name: 'download' },

];

const COLS = [
    { label: 'Icon', fieldName: '', initialWidth: 70, 
        cellAttributes: {
            iconName: 'action:email'
        } 
    },
    { label: 'From', fieldName: 'From', type: 'text', editable: false, sortable: 'true', initialWidth: 255 },
    { label: 'Subject', fieldName: 'Subject', type: 'text', editable: false, sortable: 'true', initialWidth: 359 },
    { label: 'Content', fieldName: 'Content', type: 'text', editable: false, sortable: false, initialWidth: 349 },
    { label: 'Categories', fieldName: 'Categories', type: 'text', editable: false, sortable: false },
    { label: 'Sent On', fieldName: 'FullCreatedDate', type: 'date', editable: false, sortable: 'true', initialWidth: 100 },
    { type: 'action',
        typeAttributes: { rowActions: ACTIONS },
    },    
    
];

export default class EmailAdvancedSearch extends LightningElement {

    

    @track categories = [
        { label: 'All Categories', value: 'All Categories', isSelected: true },
        { label: 'AR/Proposals', value: 'AR/Proposals', isSelected: false },
        { label: 'Bible', value: 'Bible', isSelected: false },
        { label: 'Board Meeting / Minutes / Notes', value: 'Board Meeting / Minutes / Notes', isSelected: false },
        { label: 'Breaches (ManCo)', value: 'Breaches (ManCo)', isSelected: false },
        { label: 'Certificates', value: 'Certificates', isSelected: false },
        { label: 'Comments', value: 'Comments', isSelected: false },
        { label: 'Complaints (ManCo)', value: 'Complaints (ManCo)', isSelected: false },
        { label: 'Declarations & Deeds', value: 'Declarations & Deeds', isSelected: false },
        { label: 'DEF', value: 'DEF', isSelected: false },
        { label: 'Delegate Reporting', value: 'Delegate Reporting', isSelected: false },
        { label: 'Errors (ManCo)', value: 'Errors (ManCo)', isSelected: false },
        { label: 'Financial Statements/Audit', value: 'Financial Statements/Audit', isSelected: false },
        { label: 'Forms', value: 'Forms', isSelected: false },
        { label: 'Insurance', value: 'Insurance', isSelected: false },
        { label: 'Investment Decisions / Documents', value: 'Investment Decisions / Documents', isSelected: false },
        { label: 'Investor / Operational Due Diligence', value: 'Investor / Operational Due Diligence', isSelected: false },
        { label: 'KYC', value: 'KYC', isSelected: false },
        { label: 'Letters', value: 'Letters', isSelected: false },
        { label: 'Memorandum and Articles of Association', value: 'Memorandum and Articles of Association', isSelected: false },
        { label: 'Offering Document', value: 'Offering Document', isSelected: false },
        { label: 'Onboarding', value: 'Onboarding', isSelected: false },
        { label: 'Performance Reports/Investor Letters', value: 'Performance Reports/Investor Letters', isSelected: false },
        { label: 'Onboarding', value: 'Onboarding', isSelected: false },
        { label: 'Performance Reports/Investor Letters', value: 'Performance Reports/Investor Letters', isSelected: false },
        { label: 'Policies', value: 'Policies', isSelected: false },
        { label: 'Ratification', value: 'Ratification', isSelected: false },
        { label: 'Reference / General', value: 'Reference / General', isSelected: false },
        { label: 'Register', value: 'Register', isSelected: false },
        { label: 'Regulatory Compliance', value: 'Regulatory Compliance', isSelected: false },
        { label: 'Resolutions', value: 'Resolutions', isSelected: false },
        { label: 'Side Letters', value: 'Side Letters', isSelected: false },
        { label: 'Special Situations / Regulator Request', value: 'Special Situations / Regulator Request', isSelected: false },
        { label: 'Transaction Approvals (Investors)', value: 'Transaction Approvals (Investors)', isSelected: false }
    ];

    get entriesAmountOptions() {
        return [
            { label: '50', value: '50' },
            { label: '100', value: '100' },
            { label: '200', value: '200' },
            { label: '500', value: '500' }
        ];
    }

    get businessUnitsOptions() {
        return this.businessUnits;
    }

    get categoryOptions() {
        return this.categories;
    }

    get engagementOptions() {
        return this.engagements;
    }

    @track columns = COLS;
    @api engagementId;
    @api recordId;
    @track currentRecordId;
    @track selectedCategory = '';
    @track selectedAmountOfCategories = 'All Categories';
    @track emails = [];
    @track isRendered = false;
    @track selectedEmail = {};
    @track showModal = false;
    @track isLoading = false;
    @track pageNumber = 1;
    @track entriesAmount = 100;
    @track maxRecordsToShow;
    @track listOfPageNumbers = new Array();
    @track maxAmountOfPages;
    @track sortBy;
    @track sortDirection;
    @track thereAreEmails = true;
    @track businessUnits = [{label:'All Business Units', value:'All Business Units', isSelected : true}];
    @track selectedBusinessUnits = [];
    @track selectedAmountOfBus = 'All Business Units';
    @track engagements = [{label:'All Engagements', value:'All Engagements', isSelected : false}];;
    @track selectedEngagements = [];
    @track selectedAmountOfEngagements = 'Current Engagement';
    @track isMouseOverBusinessUnits;
    @track isMouseOverCategories;
    @track isMouseOverEngagements;
    @track nameOfEngagement;
    @track disableBUFilter;

    connectedCallback() {        
        if (this.recordId == null || this.recordId ==  undefined || this.recordId.length === 0) {
            let dividedUrl = document.referrer.split('/');
            this.currentRecordId = dividedUrl[6];
        } else {
            this.currentRecordId = this.recordId;
        }

        this.selectedEngagements.push(this.currentRecordId);
        this.getBusinessUnits(this.currentRecordId);
        this.getEngagementsOfMotherAccount(this.currentRecordId);     
    }

    renderedCallback() {
        if (!this.isRendered) {
            this.search();  
            this.isRendered = true;
        }         
    }
    
    handleCategoryChange(event) {
        this.selectedCategory = event.detail.value;
    }

    search(event) {
        if (event !== undefined) {
            if (event.currentTarget.dataset.from == 'main-button') {
                this.pageNumber = 1;
            } 
        }

        this.isLoading = true;
        let dateFrom = this.template.querySelector('.input-date-from').value;
        let dateUntil = this.template.querySelector('.input-date-until').value;
        let from = this.template.querySelector('.input-from').value;
        let to = this.template.querySelector('.input-to').value;
        let contains = this.template.querySelector('.input-contains').value;
        let category = this.selectedCategory;
        let id = this.currentRecordId;
        let limitRecords = this.entriesAmount;
        let offsetRecords = this.entriesAmount * (this.pageNumber - 1);
        let businessUnits = this.selectedBusinessUnits;
        let engagements = this.selectedEngagements;

        if (dateFrom == null || dateFrom == undefined || dateFrom == '') {
            dateFrom = '1998-06-28';
        }

        if (dateUntil == null || dateUntil == undefined || dateUntil == '') {
            dateUntil = this.getTodayDate(); 
        }

        searchEmails({engagementId : id, dateFrom : dateFrom, dateUntil : dateUntil, fromAddress : from, toAddress : to, keywords : contains, category : category, limitRecords : parseInt(limitRecords), offsetRecords : parseInt(offsetRecords), businessUnitIdList : businessUnits, engagementIdList: engagements})
        .then((data) => {
            this.emails = this.normalizeFieldsOnData(data);
            this.isLoading = false;
            this.thereAreEmails =  this.emails.length > 0 ? true : false;    
        })
        .catch(error => {
            this.isLoading = false;
            console.log('Error in connectedCallback()');
            console.log(JSON.parse(JSON.stringify(error)));
        });

        countTotalEmails({engagementId : id, dateFrom : dateFrom, dateUntil : dateUntil, fromAddress : from, toAddress : to, keywords : contains, category : category, businessUnitIdList : businessUnits, engagementIdList: engagements})
        .then((data) => {
            this.maxRecordsToShow = data;    
            this.setPageNumbers(data);    
        })
        .then(() => {            
            this.colorCurrentPageNumber(); 
        })
        .catch(error => {
            this.isLoading = false;
            console.log('Error in connectedCallback()');
            console.log(JSON.parse(JSON.stringify(error)));
        });
    }

    getBusinessUnits(engagementId) {
        this.isLoading = true;
        getBusinessUnitsOfEngagement({engagementId : engagementId})
        .then((data) => {

            this.isLoading = false;
            let auxList = this.returnLabelValueListBU(data);

            for (let i = 0; i < auxList.length; i++) {
                this.businessUnits = [...this.businessUnits, auxList[i]];
            }    

        })
        .catch(error => {
            this.isLoading = false;
            console.log('Error in connectedCallback()');
            console.log(JSON.parse(JSON.stringify(error)));
        });
    }

    returnLabelValueListBU(data) {
        let auxList = data.map(function(record) {
            let newLabel;
            let newValue = record.Id;
            if (record.Parent_Object_Name__c != null && record.Parent_Object_Name__c != undefined) {
                newLabel = record.Parent_Object_Name__c.split('_')[0] + '-' + record.Name;
            } else {
                newLabel = 'n/a - ' + record.Name;
            }
        
            return {label : newLabel, value : newValue, isSelected : false};
        });

        return auxList;
    }

    getEngagementsOfMotherAccount(engagementId) {
        getRelatedEngagements({engagementId : engagementId})
        .then((data) => {
            this.isLoading = false;
            let auxList = this.returnLabelValueListEngagements(data);

            for (let i = 0; i < auxList.length; i++) { //we can't use push because that doesn't refresh the view
                this.engagements = [...this.engagements, auxList[i]];
            }  

        })
        .catch(error => {
            console.log('Error in connectedCallback()');
            console.log(JSON.parse(JSON.stringify(error)));
        });
    }


    returnLabelValueListEngagements(data) {
        let currentEng = this.currentRecordId;
        let auxList = data.map(function(record) {
            let newLabel = record.Name + '-' + record.Name__c;
            let newValue = record.Id;
            let isSelected = record.Id == currentEng ? true : false;
            let cssClass = record.Id == currentEng ? 'picklist-selected-option slds-truncate' : ''; 
            return {label : newLabel, value : newValue, isSelected : isSelected, cssClass : cssClass};
        });

        return auxList;
    }

    resetInputs() {
        let id = this.currentRecordId;
        this.template.querySelector('.input-date-from').value = '';
        this.template.querySelector('.input-date-until').value = '';
        this.template.querySelector('.input-from').value = '';
        this.template.querySelector('.input-to').value = '';
        this.template.querySelector('.input-contains').value = '';
        this.selectedAmountOfCategories = 'All Categories';
        this.selectedAmountOfBus = 'All Business Units';
        this.selectedAmountOfEngagements = 'Current Engagement'
        let selectedCategories = [];
        let selectedBusinessUnits = [];
        let selectedEngagements = [];

        this.categories.forEach(function(option) {
            if (option.label == 'All Categories') {
                option.isSelected = true;
            } else {
                option.isSelected = false;
            }
        });

        this.businessUnits.forEach(function(option) {
            if (option.label == 'All Business Units') {
                option.isSelected = true;
            } else {
                option.isSelected = false;
            }
        });     

        this.engagements.forEach(function(option) {
            if (option.value == id) {
                option.isSelected = true;
            } else {
                option.isSelected = false;
            }
        }); 
        
        this.businessUnits.forEach(function(option) {
            if (option.isSelected == true) {
                selectedBusinessUnits.push(option.value);
            }
        });        

        this.categories.forEach(function(option) {
            if (option.isSelected == true) {
                selectedCategories.push(option.value);
            }
        }); 
        
        this.engagements.forEach(function(option) {
            if (option.isSelected == true) {
                selectedEngagements.push(option.value);
            }
        });

        this.selectedCategory = selectedCategories.join(';');;
        this.selectedEngagements = selectedEngagements;
        this.selectedBusinessUnits = selectedBusinessUnits;
        this.search();
    }    

    normalizeFieldsOnData(data) {
        let currentData = [];
        let i = 0;
        data.forEach((row) => {
            let rowData = {};
            rowData.Id = row.Id;
            rowData.Subject = row.Title;
            rowData.Content = row.Description;
            rowData.Categories = row.Categories__c.replace(/;/g, ', ');
            rowData.To = row.Recipients_To__c;
            rowData.Cc = row.Recipients_CC__c;
            rowData.FullFrom = row.Recipients_From__c;    
            rowData.From = row.Recipients_From__c.includes('!') ? row.Recipients_From__c.split('!')[0] : row.Recipients_From__c;
            rowData.CreatedDate = row.CreatedDate.split('T')[0];
            rowData.FullCreatedDate = row.CreatedDate;
            rowData.CreatedHour = row.CreatedDate.split('T')[1].split('.')[0];
            rowData.DownloadUrl = '/sfc/servlet.shepherd/version/download/' + row.Id;
            currentData.push(rowData);
            if (i == 0) {
                this.nameOfEngagement = row.Comments__c;
                i++;
            }

        });

        return currentData;    
    }

    async setPageNumbers(maxRecordsToShow) {
        let totalPages;
        if (parseInt(maxRecordsToShow) > 2000) {
            if (parseInt(this.entriesAmount) === 50) {
                totalPages = 40
            } else if (parseInt(this.entriesAmount) === 100) {
                totalPages = 20
            } else if (parseInt(this.entriesAmount) === 200) {
                totalPages = 10
            } else if (parseInt(this.entriesAmount) === 500) {
                totalPages = 4;
            }
        } else {
            totalPages = Math.ceil(maxRecordsToShow / this.entriesAmount);
        }
        this.maxAmountOfPages = totalPages;
        this.listOfPageNumbers = Array.from(Array(totalPages), (_, i) => i + 1);
        this.colorCurrentPageNumber();

    }

    handlePageChange(event) {
        let isPageNumberValid = true;
        let number = event.currentTarget.dataset.number;
        if (number == -1 && this.pageNumber == 1) {
            isPageNumberValid = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No  Previous Page', 
                    message: 'There is no previous page', 
                    variant: 'info'
                })
            );
        } else if (number == -1 && this.pageNumber != 1) {
            this.pageNumber -= 1;
        }

        if (number == -2 && this.pageNumber == this.maxAmountOfPages) {
            isPageNumberValid = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No  Next Page', 
                    message: 'There is no next page', 
                    variant: 'info'
                })
            );
        } else if (number == -2 && this.pageNumber != this.maxAmountOfPages) {
            this.pageNumber += 1;
        }

        if (isPageNumberValid) {
            if (number != -1 && number != -2) {
                this.pageNumber = number;
            }            
            this.colorCurrentPageNumber();
            this.search();
        }
    }

    colorCurrentPageNumber() {
        this.template.querySelectorAll('.slds-m-left_x-small.pagination-button').forEach((but)=>{
            if (parseInt(this.pageNumber) === parseInt(but.dataset.number,10)) {
                but.variant = 'brand';
            } else {
                but.variant = 'neutral';
            }
        });
    }

    openModal() {
        this.showModal = true;        
    }

    closeModal() {
        this.showModal = false;  
    }

    handleEntryAmountChange(event) {
        this.entriesAmount = event.detail.value;
        this.pageNumber = 1;
        this.search();
        this.colorCurrentPageNumber();  
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const defaultRow = event.detail.row;
        const row = JSON.parse(JSON.stringify(defaultRow));

        switch (actionName) {
            case 'details':
                this.selectedEmail = row;
                this.openModal();
                break;
            case 'download':
                this.downloadEmailFromTable(row);
                break;
            default:
                break;
        }        
        
    }

    downloadEmailFromTable(row) {
        let tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.setAttribute('href', row.DownloadUrl);
        tempLink.setAttribute('target', '_blank');
        tempLink.click();
    }

    handleSortdata(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }


    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.emails));

        let keyValue = (a) => {
            return a[fieldname];
        };
 
        let isReverse = direction === 'asc' ? 1: -1;

        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; 
            y = keyValue(y) ? keyValue(y) : '';

            return isReverse * ((x > y) - (y > x));
        });

        this.emails = parseData;
    }

    //Multi-select picklist methods for Business Units

    get mainDivClassAttrBusinessUnits() {
        return (this.isMouseOverBusinessUnits) ? 'slds-picklist slds-dropdown-trigger slds-dropdown-trigger--click slds-is-open' :
                                                'slds-picklist slds-dropdown-trigger slds-dropdown-trigger--click';
    }

    handleMouseEnterBusinessUnits() {
        this.isMouseOverBusinessUnits = true;
    }

    handleMouseLeaveBusinessUnits() {
        this.isMouseOverBusinessUnits = false;
    }

    handleSelectionBusinessUnits(event) {
        let tickedOptions = 0;
        let selectedOptions = [];
        const selectedId = event.currentTarget.dataset.id;
        const checkedOrUnchecked = event.target.checked;


        if (selectedId == 'All Business Units') {
            this.businessUnits.forEach(function(option) {
                option.isSelected = false;
            });
        } else {
            this.businessUnits.forEach(function(option) {
                if (option.value === selectedId) {
                    option.isSelected = checkedOrUnchecked;
                }
            });
            this.businessUnits.forEach(function(option) {
                if (option.isSelected && option.label != 'All Business Units') {
                    tickedOptions += 1;
                }
            });
        }
        
        this.selectedAmountOfBus = tickedOptions;        

        if (tickedOptions === 0) {
            this.selectedAmountOfBus = 'All Business Units';
            this.businessUnits.forEach(function(option) {
                if (option.value == 'All Business Units') {
                    option.isSelected = true;
                }
            });
        } else {
            this.businessUnits.forEach(function(option) {
                if (option.value == 'All Business Units') {
                    option.isSelected = false;
                }
            });
        }

        this.businessUnits.forEach(function(option) {
            if (option.isSelected == true) {
                selectedOptions.push(option.value);
            }
        });
        
        this.selectedBusinessUnits = selectedOptions;
    }

    //Multi-select picklist methods for Categories

    get mainDivClassAttrCategories() {
        return (this.isMouseOverCategories) ? 'slds-picklist slds-dropdown-trigger slds-dropdown-trigger--click slds-is-open' :
                                              'slds-picklist slds-dropdown-trigger slds-dropdown-trigger--click';
    }

    handleMouseEnterCategories() {
        this.isMouseOverCategories = true;
    }

    handleMouseLeaveCategories() {
        this.isMouseOverCategories = false;
    }

    handleSelectionCategories(event) {
        let tickedOptions = 0;
        let selectedOptions = [];
        const selectedId = event.currentTarget.dataset.id;
        const checkedOrUnchecked = event.target.checked;

        if (selectedId == 'All Categories') {
            this.categories.forEach(function(option) {
                option.isSelected = false;
            });
        } else {
            this.categories.forEach(function(option) {
                if (option.value === selectedId) {
                    option.isSelected = checkedOrUnchecked;
                }
            });
            this.categories.forEach(function(option) {
                if (option.isSelected && option.label != 'All Categories') {
                    tickedOptions += 1;
                }
            });
        }
        
        this.selectedAmountOfCategories = tickedOptions;        

        if (tickedOptions === 0) {
            this.selectedAmountOfCategories = 'All Categories';
            this.categories.forEach(function(option) {
                if (option.value == 'All Categories') {
                    option.isSelected = true;
                }
            });
        } else {
            this.categories.forEach(function(option) {
                if (option.value == 'All Categories') {
                    option.isSelected = false;
                }
            });
        }

        this.categories.forEach(function(option) {
            if (option.isSelected == true) {
                selectedOptions.push(option.value);
            }
        });

        this.selectedCategory = selectedOptions.join(';');
    }

    //Multi-select picklist methods for Engagements

    get mainDivClassAttrEngagements() {
        return (this.isMouseOverEngagements) ? 'slds-picklist slds-dropdown-trigger slds-dropdown-trigger--click slds-is-open' :
                                               'slds-picklist slds-dropdown-trigger slds-dropdown-trigger--click';
    }

    handleMouseEnterEngagements() {
        this.isMouseOverEngagements = true;
    }

    handleMouseLeaveEngagements() {
        this.isMouseOverEngagements = false;
    }

    handleSelectionEgagements(event) {
        let tickedOptions = 0;
        let selectedOptions = [];
        let engId = this.currentRecordId;
        const selectedId = event.currentTarget.dataset.id;
        const checkedOrUnchecked = event.target.checked;

        if (selectedId == 'All Engagements') {
            this.engagements.forEach(function(option) {
                option.isSelected = false;
            });
        } else {
            this.engagements.forEach(function(option) {
                if (option.value === selectedId) {
                    option.isSelected = checkedOrUnchecked;
                }
            });
            this.engagements.forEach(function(option) {
                if (option.isSelected && option.label != 'All Engagements') {
                    tickedOptions += 1;
                }
            });
        }
        
        this.selectedAmountOfEngagements = tickedOptions;        

        if (tickedOptions === 0) {
            this.selectedAmountOfEngagements = 'All Engagements';
            this.engagements.forEach(function(option) {
                if (option.value == 'All Engagements') {
                    option.isSelected = true;
                }
            });
        } else {
            this.engagements.forEach(function(option) {
                if (option.value == 'All Engagements') {
                    option.isSelected = false;
                }
            });
        }
        
        let changeText = false;
        let disableBuFilter = true;
        if (this.selectedAmountOfEngagements === 1) {
            this.engagements.forEach(function(option) {
                if (option.value ==  engId && option.isSelected ==  true) {
                    changeText = true;
                    disableBuFilter = false;
                }
            });                
        }
        
        this.setBuFilterAsDisabled(disableBuFilter);
        if (changeText) {
            this.selectedAmountOfEngagements = 'Current Engagement';
        }

        this.engagements.forEach(function(option) {
            if (tickedOptions === 0) {
                if (!(option.value === 'All Engagements')) {
                    selectedOptions.push(option.value);
                }
            }else if (option.isSelected == true) {
                selectedOptions.push(option.value);
            }
        });

        this.selectedEngagements = selectedOptions;
    }

    setBuFilterAsDisabled(yes) {
        if (yes) {
            this.template.querySelector('.bu-filter').className = 'slds-button slds-button--neutral slds-picklist__label multi-select-picklist-button bu-filter disabled-button';
            this.selectedAmountOfBus = 'All Business Units';
        } else {
            this.template.querySelector('.bu-filter').className = 'slds-button slds-button--neutral slds-picklist__label multi-select-picklist-button bu-filter';
        }
    }

    //End methods for pisklists.

    returnToStandardView() {
        const hideAdvancedSearchEvent = new CustomEvent("hideadvancedsearch", {});
        this.dispatchEvent(hideAdvancedSearchEvent);
    }

    getTodayDate() {
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let yyyy = today.getFullYear();
        let todayStr =  yyyy + '-' + mm + '-' + dd; 

        return todayStr;
    }

    getTomorrowDate() {
        Date.prototype.addDays = function(days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }

        let tomorrow = new Date();
        let dd = String(tomorrow.getDate()).padStart(2, '0');
        let mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        let yyyy = tomorrow.getFullYear();
        let tomorrowStr = yyyy + '-' + mm + '-' + dd;

        return tomorrowStr;
    }

}
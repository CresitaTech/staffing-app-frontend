import { Subscription } from "rxjs";
import { APIPath } from "../enums/api-path.enum";
import { SortingOrder } from "../enums/sorting-order.enum";
import { APIProviderService } from "../services/api-provider.service";
import { GlobalApiResponse } from "../models/global_api_response";
import { SelectAllService } from "../services/common/select-all.service";
import { environment } from "src/environments/environment.prod";
import { Assignment } from "../models/assignment-list";

export class Paging<T> {

    // PROPERTIES
    page: number = 1;
    limit: number = 10;
    search: string = '';
    sort = '-created_at';
    sorting_order: SortingOrder = SortingOrder.ASC;
    collectionSize: number = 0;
    collection: Array<T> | Array<any> = [];
    selectedItems: Array<T> = [];
    api_path: APIPath;
    count = 0;
    tags: Array<any> = [];
    formClose: boolean = true;
    ip: string;
    order: boolean = true;
    collectionMapForSelectFlag = new Map<string, boolean>();
    collectionMapForEmail = new Map<string, string>();
    collectionMapForPriority = new Map<string, boolean>();
    collectionMapForName = new Map<string, string>();
    collectionMapForId = new Map<string, string>();
    routerURL;
    // helps to open View only detail on click of row
    selectedItemIndex: number = undefined;
    assignment = {} as Assignment;
    // row selected logic
    masterSelected: boolean = false;

    fetchSub: Subscription;
    deleteSubs: Array<Subscription> = [];
    listId: string;
    jobId: string;
    candidateId: string;
    massDeleteArray: Array<string> = [];
    idString: string = '';
    deleteJSON: { delete_ids: string; };
    mycandidateCheck: boolean;
    allJobsCheck: boolean = false;

    constructor(
        protected _api: APIProviderService<T>,
        private selectAllService: SelectAllService
    ) {
        this.ip = this._api.ip; // reading server path for other media files
    }

    // fetchCollectionList1(): void{
    //     this.fetchSub = this._api.
    //     getCollection(this.api_path, this.offSet(), this.limit, this.search, this.sort,null)
    //     .subscribe((res: GlobalApiResponse<T> | Array<T> | Array<any>) => {
    //         this.collection = res['results'] ? res['results'] : res;
    //         console.log(res);
    //         console.log(this.collection + "hello world");
    //         console.log(Object.keys(this.collection[0]));
    //         var localCount = 0;
    //     })
    // }

    // METHODS
    public fetchCollectionList(adFilterQueries?: string): void {
        console.log(this.api_path)
        if(((this.search !== '' || this.search.toLowerCase().includes('opjd')) && this.selectAllService.allJobsToogle === true)){
            this.routerURL = "alljobs";
        }
        if(this.search === '' && this.selectAllService.allJobsToogle === false ){
            this.routerURL = '';
            console.log(this.routerURL + "My name is vishnu");
        }
        if(this.search === '' && this.selectAllService.allJobsToogle === true){
            this.routerURL = "alljobs"
        }
        if(this.search !== '' && this.selectAllService.allJobsToogle === false){
            this.routerURL = '';
        }

        // console.log(this.routerURL);
        if (this.routerURL === "my-candidates") {
            this.fetchCollectionListWithExactAPI(this.api_path + `?action=${this.routerURL}&limit=${this.limit}&offset=${this.offSet()}&search=${this.search}&ordering=${this.sort}${adFilterQueries ? adFilterQueries : ''}`);
        }
        else if (this.routerURL === "myjobs") {
            this.fetchCollectionListWithExactAPI("/reports/get_assinged_dashboard_list/" + `?action=${this.routerURL}&limit=${this.limit}&offset=${this.offSet()}&search=${this.search}&ordering=${this.sort}${adFilterQueries ? adFilterQueries : ''}`);
        }
        else if (this.routerURL === "alljobs") {
            this.fetchCollectionListWithExactAPI(this.api_path + `?action=${this.routerURL}&limit=${this.limit}&offset=${this.offSet()}&search=${this.search}&ordering=${this.sort}${adFilterQueries ? adFilterQueries : ''}`);
        }

        else if (this.routerURL === "vendor-list-details") {
            this.fetchCollectionVendorList(this.listId);
        }
        else if (this.routerURL === "email-list-details") {
            console.log("fetchCollectionEmailList");
            this.fetchCollectionEmailList(this.listId);
        }
        else if (this.routerURL === "campaign-details") {
            console.log("fetchCollectionCampaignDetails");
            this.fetchCollectionCampaignDetails(this.listId);
        }
        else if (this.api_path === APIPath.UNASSIGNED_JOBS_STATUS) {
            console.log("JOB_ASSIGNMENT");
            this.fetchCollectionAssignemnt(this.jobId);
        }

        else {
            console.log(adFilterQueries)
            console.log("this is filter")
            this.fetchSub = this._api.
                getCollection(this.api_path, this.offSet(), this.limit, this.search, this.sort, adFilterQueries)
                .subscribe((res: GlobalApiResponse<T> | Array<T> | Array<any>) => {
                    this.collection = res['results'] ? res['results'] : res;
                    console.log(res);

                    console.log(this.collection + "hello world");
                    // console.log(Object.keys(this.collection[0]));
                    var localCount = 0;
                    if (this.collection && this.collection.length > 0 && this.api_path !== "/campaigns/custom_fields/") {
                        // console.log(Object.keys(this.collection[0]));
                        this.tags = Object.keys(this.collection[0]);
                        var idIndex = this.tags.indexOf("id");
                        this.tags.splice(idIndex, 1);
                        var updatedByIndex = this.tags.indexOf("updated_by");
                        this.tags.splice(updatedByIndex, 1);
                        var createdByIndex = this.tags.indexOf("created_by");
                        this.tags.splice(createdByIndex, 1);
                        var updatedATIndex = this.tags.indexOf("updated_at");
                        this.tags.splice(updatedATIndex, 1);
                        var createdAtIndex = this.tags.indexOf("created_at");
                        this.tags.splice(createdAtIndex, 1);

                    }else{
                        this.collection.forEach(_ => {
                            this.tags.push(_.field_name);
                        })
                    }
                    console.log(this.collection.length);
                    this.collection.forEach(_ => {

                        if (_.isSelected === undefined && !this.collectionMapForSelectFlag.has(_.id)) {
                            _.isSelected = false;
                            this.collectionMapForSelectFlag.set(_.id, _.isSelected);
                        }
                        if (_.isSelected === undefined && this.collectionMapForSelectFlag.has(_.id)) {
                            _.isSelected = this.collectionMapForSelectFlag.get(_.id);
                            if (_.isSelected === true)
                                localCount++;
                        }
                        // console.log(this.collectionMapForSelectFlag);

                    })
                    localCount === this.limit ? this.masterSelected = true : this.masterSelected = false;
                    //   console.log(this.collection)
                    this.collectionSize = res['count'];
                })
        }
    }

    setPageSize() {
        console.log(this.allJobsCheck);
        var value = (document.getElementById('page-size') as HTMLSelectElement).value;
        this.limit = Number(value);
        var url = this.api_path + "?action=my-candidates";
        if(this.allJobsCheck === true){
            url = this.api_path + "?action=alljobs";
        }
        if(this.mycandidateCheck || this.allJobsCheck){
            this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit} &offset=${this.offSet()}&search=&ordering=-created_at`);
        }else{
            this.fetchCollectionList()
        }

    }

    setBestCandidatePageSize(jobId: string) {
        this.jobId = jobId;
        var value = (document.getElementById('page-size') as HTMLSelectElement).value;
        this.limit = Number(value);
        this.fetchCollectionBestJobsList(jobId);
    }

    setListPageSize(listId: string) {
        this.listId = listId;
        var value = (document.getElementById('page-size') as HTMLSelectElement).value;
        this.limit = Number(value);
        this.fetchCollectionVendorList(listId);
    }

    setBestJobPageSize(candidateId: string) {
        this.candidateId = candidateId;
        var value = (document.getElementById('page-size') as HTMLSelectElement).value;
        this.limit = Number(value);
        this.fetchCollectionRecommendedJobsList(candidateId);
    }

    public fetchCollectionVendorList(listId: string, adFilterQueries?: string): void {
        console.log(listId);
        if (this.routerURL === "vendor-list-details") {
            this.fetchCollectionListWithExactAPI(this.api_path + `?list_id=${listId}&limit=${this.limit}&offset=${this.offSet()}&ordering=${this.sort}&search=${this.search}`);
        }
    }

    public fetchCollectionEmailList(listId: string, adFilterQueries?: string): void {
        console.log(listId);
        console.log(this.api_path);
        if (this.routerURL === "email-list-details") {
            this.fetchCollectionListWithExactAPI(this.api_path + `?list_id=${listId}&limit=${this.limit}&offset=${this.offSet()}&ordering=${this.sort}&search=${this.search}`);
        }
    }

    public fetchCollectionCampaignDetails(listId: string, adFilterQueries?: string): void {
        console.log(listId);
        console.log(this.api_path);
        if (this.routerURL === "campaign-details") {
            this.fetchCollectionListWithExactAPI(this.api_path + `?campaign_id=${listId}&limit=${this.limit}&offset=${this.offSet()}&ordering=${this.sort}&search=${this.search}`);
        }
    }

    public fetchCollectionAssignemnt(jobId: string, adFilterQueries?: string): void {
        console.log(jobId);
        console.log(this.api_path);
        if (this.api_path === APIPath.UNASSIGNED_JOBS_STATUS) {
            this.fetchCollectionListWithExactAPIAssigment(this.api_path + `?job_id=${jobId}&limit=${this.limit}&offset=${this.offSet()}&ordering=${this.sort}&search=${this.search}`);
        }
    }




    public fetchCollectionBestJobsList(jobId: string, adFilterQueries?: string): void {
        console.log(jobId);
        this.fetchCollectionListWithExactAPI('/analytics/recommended_candidates/' + `?job_id=${jobId}&limit=${this.limit}&offset=${this.offSet()}&ordering=${this.sort}&search=${this.search}`);

    }

    public fetchCollectionRecommendedJobsList(candidateId: string, adFilterQueries?: string): void {
        this.fetchCollectionListWithExactAPI('/analytics/recommended_jobs/' + `?candidate_id=${candidateId}&limit=${this.limit}&offset=${this.offSet()}&ordering=${this.sort}&search=${this.search}`);

    }

    protected fetchCollectionListWithExactAPI(path: string): void {
        console.log(path);
        this.fetchSub = this._api.getReportWithApiLink(path)
            .subscribe((res: GlobalApiResponse<T>) => {
                this.collection = res.results;
                this.collectionSize = res.count;
                console.log(this.collection)
            })
    }

    protected fetchCollectionListWithExactAPIAssigment(path: string, adFilterQueries?: string): void {
        this.fetchSub = this._api.getReportWithApiLink(path+`&limit=${this.limit}&offset=${this.offSet()}&ordering=${this.sort}&search=${this.search}`)
            .subscribe((res) => {

                if(res && res.last_assigned_recruiter && res.last_assigned_recruiter.length > 0){
                    this.assignment.primary_recruiter_name = res.last_assigned_recruiter[0].primary_recruiter_name;
                    this.assignment.secondary_recruiter_name = res.last_assigned_recruiter[0].secondary_recruiter_name;
                    this.assignment.primary_recruiter_email = res.last_assigned_recruiter[0].primary_recruiter_email;
                    this.assignment.secondary_recruiter_email = res.last_assigned_recruiter[0].secondary_recruiter_email;
                    }
                this.collection = res.results;
                this.collectionSize = res.count;

                for(let i =0; i < this.collection.length; i++){

                    if(this.collection[i].id == this.jobId){
                        this.collection.splice(i, 1);
                        this.collectionSize--;
                        break;
                    }

                }
                console.log(this.collection)
            })
    }


    protected fetchCollectionListForDropDowns(path: string): void {
        this.fetchSub = this._api.getReportWithApiLink(path)
            .subscribe((res) => {
                this.collection = res;
                this.collectionSize = res.count;
                //console.log(this.collection)
            })
    }

    exportItem1(path: string, adFilterQueries?: string): void {
        this._api.exportCollection(path, this.sort, 'text', adFilterQueries).subscribe((res) => {
            var downloadLink = document.createElement("a");
            var blob = new Blob(["\ufeff", res]);
            var url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = "export-candidate-data.csv";

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        })
    }

    exportItem(path: string, adFilterQueries?: string) {
        let fileName = "export-candidate-data.csv"
        let url = `${path}?ordering=${this.sort}${adFilterQueries ? adFilterQueries : ''}`
        this._api
            .getReportWithApiLink(url, 'text')
            .subscribe(res => {
                var downloadLink = document.createElement("a");
                var blob = new Blob(["\ufeff", res]);
                var url = URL.createObjectURL(blob);
                downloadLink.href = url;
                downloadLink.download = fileName;

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            });
    }

    exportCandidateItem(path: string, mycandidateCheck: boolean, adFilterQueries?: string) {
      let fileName = "export-candidate-data.csv";
      console.log("isChecked: " + mycandidateCheck);

      if (mycandidateCheck) {
        console.log("myc: " + mycandidateCheck);
        var url = `${path}?action=my-candidates&ordering=${this.sort}${adFilterQueries ? adFilterQueries : ''}`;
      } else if (!mycandidateCheck){
        console.log("else B");
        var url = `${path}?ordering=${this.sort}${adFilterQueries ? adFilterQueries : ''}`;
      }

      this._api
          .getReportWithApiLink(url, 'text')
          .subscribe(res => {
              var downloadLink = document.createElement("a");
              var blob = new Blob(["\ufeff", res]);
              var url = URL.createObjectURL(blob);
              downloadLink.href = url;
              downloadLink.download = fileName;

              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
          });
    }

    patchSelectedItem(id: string, collection: any): void {
        this._api.patchCollectionItemById(this.api_path, id, collection).subscribe((res: T) => {
            this.fetchCollectionList();
        })
    }


    deleteCollectionItemForMassDelete(id: any): void {
        this.api_path = APIPath.VENDOR_BULK_DELETE;
        const deleteSub = this._api.deleteCollectionItemByIdString(this.api_path, id)
            .subscribe((res: T) => {
            });
        this.deleteSubs.push(deleteSub)
        this.count = 0;
    }


    deleteCollectionItemForMultiDelete(id: string): void {
        const deleteSub = this._api.deleteCollectionItemById(this.api_path, id)
            .subscribe((res: T) => {
            });
        this.deleteSubs.push(deleteSub)
        this.count = 0;
    }


    deleteCollectionItem(id: string): void {
        const deleteSub = this._api.deleteCollectionItemById(this.api_path, id)
            .subscribe((res: T) => {
                this.fetchCollectionList();
            });
        this.deleteSubs.push(deleteSub)
        this.count = 0;
    }


    deleteCollectionItemForExactAPI(segment: string, id: string): void {
        const deleteSub = this._api.deleteCollectionItemById(this.api_path, id)
            .subscribe((res: T) => {
                this.fetchCollectionListWithExactAPI(segment);
            });
        this.deleteSubs.push(deleteSub)
        this.count = 0;
    }

    deleteCollectionItemForExactAPISent(segment: any, id: string): void {
        const deleteSub = this._api.deleteCollectionItemById(segment, id)
            .subscribe((res: T) => {
                this.fetchCollectionListForDropDowns(this.api_path);
            });
        this.deleteSubs.push(deleteSub)
        this.count = 0;
    }

    //mass delete all the selected items.
    massDeleteSelectedCollectionItem() {
        // console.log(this.collectionMapForSelectFlag)
        // this.collectionMapForSelectFlag.forEach((value, key) => {
        //     if (value == true) {
        //         // const deleteId = key.replace(/-/g, "")
        //         //console.log(deleteId)
        //         //this.idString.concat(deleteId)
        //         this.massDeleteArray.push(key);
        //         this.idString = this.massDeleteArray.join(",");
        //         this.deleteJSON =
        //         {
        //             "delete_ids": this.idString,

        //         };
        //     }
        //     this.count = 0;
        // })
        // this.deleteCollectionItemForMassDelete(this.deleteJSON);
        // console.log(this.idString);
        // this.fetchCollectionList();



        this.collectionMapForSelectFlag.forEach((value, key) => {
            if (value == true) {
                // const Id = key.replace(/-/g, "")
                this.massDeleteArray.push(key)
                this.idString = this.massDeleteArray.join(",")
                this.deleteCollectionItemForMultiDelete(key);
            }
            this.count = 0;
        })
        //console.log(this.idString);
        this.fetchCollectionList();
    }

    //delete all the selected items.
    deleteSelectedCollectionItem() {
        //console.log(this.collectionMapForSelectFlag)
        this.collectionMapForSelectFlag.forEach((value, key) => {
            if (value == true) {
                // const Id = key.replace(/-/g, "")
                this.massDeleteArray.push(key)
                this.idString = this.massDeleteArray.join(",")
                this.deleteCollectionItemForMultiDelete(key);
            }
            this.count = 0;
        })
        //console.log(this.idString);
        this.fetchCollectionList();
    }


    openExport() {

    }


    /**
     * REST API needs start of stating offset from data should be return
     * method provides offset
     */
    protected offSet(): number {
        return (this.page - 1) * this.limit;
    }

    changeSortingOrder() {
        this.sort = this.sort.startsWith('-')
            ? this.sort.substr(1)
            : '-' + this.sort
    }



    // refreshPage(): void { }



    openSidePane(sidePaneId: string, width: number): void {
        document.getElementById(sidePaneId).style.width = `${width}px`;
    }



    closeSidePane(sidePaneId: string): void {
        document.getElementById(sidePaneId).style.width = "0";
    }


    protected unsubscribeDeleteSub(): void {
        // this.deleteSubs.forEach((d: Subscription) => {
        //     d.unsubscribe();
        // })
    }


    /**************************************
    * Row selection logics below
    ***************************************/

    checkUncheckAll() {
        // console.log(this.count)
        this.count = this.selectAllService.countCheckOrUncheck(this.collection, this.masterSelected,
            this.collectionMapForSelectFlag, this.collectionMapForEmail, this.collectionMapForId, this.collectionMapForPriority, this.collectionMapForName);
        // console.log(this.collectionMapForSelectFlag);
    }


    isAllSelected() {
        var temp;
        // console.log(temp)
        temp = this.selectAllService.allSelected(this.collection, this.masterSelected,
            this.collectionMapForSelectFlag, this.collectionMapForEmail, this.collectionMapForId, this.collectionMapForPriority, this.collectionMapForName);
        this.masterSelected = temp.masterSelected;
        this.count = temp.count;
    }

    // *************** Row selection logics ends ****************



    /**
     * opens candidate's detail in view only mode, below row
     */
    openRowDetail(index: number) {
        if (this.selectedItemIndex === index) {
            this.selectedItemIndex = undefined;
            return;
        }
        this.selectedItemIndex = index;
    }

}

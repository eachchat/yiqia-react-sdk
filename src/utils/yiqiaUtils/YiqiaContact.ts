import { AttachmentState, bookInfoParse, bookInfos, DepartmentModal } from "../../models/YiqiaModels";
import { AuthApi } from "./YiqiaRequestInterface";

export class YiqiaContact {
    private static YiqiaContactInstance;
    constructor() {

    }

    public static get Instance() {
        if(!this.YiqiaContactInstance) {
            this.YiqiaContactInstance = new YiqiaContact();
        }
        return this.YiqiaContactInstance;
    }

    public yiqiaGmsSearch(term) {
        return AuthApi.Instance.contactSearch({
                body: JSON.stringify({
                    keywork: term.trim(),
                }),
            })
            .then((resp) => {
                if(resp && resp.code == 200 && resp.results) {
                    return resp.results;
                } else {
                    return [];
                }
            })
            .catch((err) => {
                console.log("err ", err);
                return [];
            })
    }
}

// export class ContactFetcher {
//     private static internalInstance: ContactFetcher;
//     private cli: any;
//     private homeserver_base_url: string;
//     private hAccessToken: string;

//     private constructor() {
//         this.cli = MatrixClientPeg.get();
//         this.homeserver_base_url = this.cli.getHomeserverUrl();
//         this.fetchContactInfos();
//     }

//     public static get instance(): ContactFetcher {
//         if(!this.internalInstance) {
//             this.internalInstance = new ContactFetcher();
//         }
//         return ContactFetcher.internalInstance;
//     }

//     private async fetchContactInfos() {
//         if(!this.hAccessToken) {
//             this.hAccessToken = await this.cli.getAccessToken();
//         }
//         this._fetchDepartmentInfos();
//         this._fetchUserInfos();
//     }

//     private async _fetchDepartmentInfos(sequenceId = 0) {
//         let newSequence = sequenceId;
//         try {
//             const allInfo = await (await fetch(this.homeserver_base_url + "/api/apps/org/v1/increment", {
//                     method: "POST",
//                     mode: "cors",
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Accept': 'application/json',
//                         'Authorization': 'Bearer ' + this.hAccessToken,
//                     },
//                     body: JSON.stringify({
//                         name: "updateDepartment",
//                         updateTime: 0,
//                         perPage: 10,
//                         sequenceId: newSequence,
//                     }),
//                 })).json();
//             console.log(allInfo);
//             for(let index in allInfo.data.results) {
//                 newSequence++;
//                 const item = allInfo.data.results[index];
//             }
//         } catch(error) {
    
//         }
//     }

//     private async _fetchUserInfos(sequenceId = 0) {

//     }
// }

// export async function getContact(): Promise<DepartmentModal[]> {
//     const matrixClient = MatrixClientPeg.get();
//     const homeserver_base_url = matrixClient.getHomeserverUrl();
//     const hAccessToken = await matrixClient.getAccessToken();

//     try {
//         const allInfo = await (await fetch(homeserver_base_url + "/api/apps/org/v1/increment", {
//                 method: "POST",
//                 mode: "cors",
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json',
//                     'Authorization': 'Bearer ' + hAccessToken,
//                 },
//                 body: JSON.stringify({
//                     name: "updateDepartment",
//                     updateTime: 0,
//                     perPage: 10,
//                     sequenceId: 0,
//                 }),
//             })).json();
//         console.log(allInfo);
//         return allInfo.results;
//         }
//     catch(error) {

//     }
// }